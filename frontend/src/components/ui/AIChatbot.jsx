import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Rnd } from 'react-rnd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/api';
import { 
  Send, X, ChevronRight, MapPin, CheckCircle, Shield, Menu, PlusSquare, MessageSquare
} from 'lucide-react';
import styles from './AIChatbot.module.css';

function migrateLegacyProactiveInsight(session) {
  const messages = Array.isArray(session.messages) ? session.messages : [];
  const firstUserIndex = messages.findIndex(message => message.sender === 'user');
  const assistantMessagesBeforeUser = messages
    .slice(0, firstUserIndex < 0 ? messages.length : firstUserIndex)
    .filter(message => message.sender === 'ai');
  const savedInsight = assistantMessagesBeforeUser[1];
  const hasLegacyInsight = assistantMessagesBeforeUser.length > 1
    && (!savedInsight?.proactiveInsight
      || !Array.isArray(savedInsight.topics)
      || savedInsight.topics.some(topic => !Array.isArray(topic.headers) || !Array.isArray(topic.rows)));

  if (!hasLegacyInsight) return session;

  const welcomeIndex = messages.indexOf(assistantMessagesBeforeUser[0]);
  const preserveFromIndex = firstUserIndex < 0 ? messages.length : firstUserIndex;
  const preservedMessages = messages.filter((message, index) => (
    index === welcomeIndex || index >= preserveFromIndex
  ));

  return {
    ...session,
    messages: preservedMessages,
    proactiveInsightPending: true,
  };
}

export default function AIChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // State for Drag & Resize
  const [windowSize, setWindowSize] = useState(() => {
    const w = window.innerWidth > 768 ? 380 : window.innerWidth - 32;
    const h = Math.min(window.innerWidth > 768 ? 520 : 480, window.innerHeight - 100);
    return { width: w, height: h };
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedInsightTopic, setExpandedInsightTopic] = useState(null);
  const messageEndRef = useRef(null);
  const insightsRequestedRef = useRef(new Set());

  // Multi-session State
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const isAdmin = user?.perfil === 'ADMIN';
  const isGestor = user?.perfil === 'GESTOR';
  const isCitizen = user?.perfil === 'CITIZEN' || (!isAdmin && !isGestor);
  const isCitizenPage = location.pathname.startsWith('/app');

  const suggestions = isAdmin 
    ? [
        { label: 'Dados do Dashboard', text: 'me traga os dados do dashboard' },
        { label: 'Solicitações Urgentes', text: 'quais são as solicitações urgentes?' },
        { label: 'Principais Categorias', text: 'quais são os problemas mais comuns?' }
      ]
    : isGestor
    ? [
        { label: 'Chamados do Órgão', text: 'solicitações do meu órgão' },
        { label: 'Equipes de Campo', text: 'equipes ativas' },
        { label: 'Casos Urgentes', text: 'chamados urgentes' }
      ]
    : [
        { label: 'Minhas Solicitações', text: 'quais são as minhas solicitações?' },
        { label: 'Nova Solicitação', text: 'como fazer uma nova solicitação?' },
        { label: 'Como funciona?', text: 'como funciona o cuida+ brasil?' }
      ];

  // Load History on Mount
  useEffect(() => {
    if (user) {
      const key = `cuidar_chatbot_sessions_${user.cpf}`;
      const saved = localStorage.getItem(key);
      
      let loadedSessions = [];
      if (saved) {
        try { loadedSessions = JSON.parse(saved); } catch (e) {}
      }

      // Migration for old single-chat history if no new sessions found
      if (loadedSessions.length === 0) {
        const oldKey = `cuidar_chatbot_history_${user.cpf}`;
        const oldSaved = localStorage.getItem(oldKey);
        if (oldSaved) {
          try {
            const oldMessages = JSON.parse(oldSaved);
            if (oldMessages.length > 0) {
               loadedSessions = [{
                 id: 'migrated-session',
                 title: 'Chat Antigo',
                 messages: oldMessages,
                 updatedAt: Date.now()
               }];
            }
          } catch(e) {}
        }
      }

      if (loadedSessions.length === 0) {
        const defaultSession = createNewSessionObject();
        loadedSessions = [defaultSession];
      }

      const migratedSessions = loadedSessions.map(migrateLegacyProactiveInsight);
      setSessions(migratedSessions);
      setActiveSessionId(migratedSessions[0].id);
    }
  }, [user]);

  // Save History on Change
  useEffect(() => {
    if (user && sessions.length > 0) {
      const key = `cuidar_chatbot_sessions_${user.cpf}`;
      localStorage.setItem(key, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, activeSessionId, isOpen, isTyping]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const createNewSessionObject = () => {
    const welcomeText = isAdmin
      ? `Olá, Administrador ${user.nome}! Sou a Luna. Como posso ajudar hoje?`
      : isGestor
      ? `Olá, Gestor(a) ${user.nome}! Sou a Luna. Como posso ajudar hoje?`
      : `Olá, ${user.nome}! Sou a Luna. Como posso ajudar?`;
      
    return {
      id: Date.now().toString(),
      title: 'Nova Conversa',
      messages: [{ id: Date.now(), sender: 'ai', text: welcomeText }],
      updatedAt: Date.now()
    };
  };

  const handleNewChat = () => {
    const session = createNewSessionObject();
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    setShowSidebar(false);
  };

  const handleSwitchChat = (id) => {
    setActiveSessionId(id);
    setShowSidebar(false);
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    setSessions(prev => {
      const newSess = prev.filter(s => s.id !== id);
      if (newSess.length === 0) newSess.push(createNewSessionObject());
      if (activeSessionId === id) setActiveSessionId(newSess[0].id);
      return newSess;
    });
  };

  const updateSessionMessages = (newMessages, updateTitle = false) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        let title = s.title;
        // Generate a title based on first user message if it's "Nova Conversa"
        if (updateTitle && title === 'Nova Conversa') {
          const firstUserMsg = newMessages.find(m => m.sender === 'user');
          if (firstUserMsg) {
             title = firstUserMsg.text.substring(0, 25) + (firstUserMsg.text.length > 25 ? '...' : '');
          }
        }
        return { ...s, title, messages: newMessages, updatedAt: Date.now() };
      }
      return s;
    }).sort((a,b) => b.updatedAt - a.updatedAt));
  };

  const appendMessageToSession = (sessionId, message) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;
      const messages = [...session.messages];
      if (message.proactiveInsight) {
        messages.splice(Math.min(1, messages.length), 0, message);
      } else {
        messages.push(message);
      }
      return {
        ...session,
        messages,
        proactiveInsightPending: false,
        updatedAt: Date.now(),
      };
    }).sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const openInsightOccurrence = (occurrenceId) => {
    if (user?.perfil === 'CITIZEN') {
      setIsOpen(false);
      navigate(`/app/protocolo/${occurrenceId}`);
      return;
    }

    if (['ADMIN', 'GESTOR'].includes(user?.perfil)) {
      setIsOpen(false);
      navigate('/admin/solicitacoes', { state: { selectedIncidentId: occurrenceId } });
    }
  };

  const openInsightDestination = (destination) => {
    if (!destination) return;
    setIsOpen(false);
    navigate(destination);
  };

  const canOpenInsightOccurrences = ['CITIZEN', 'ADMIN', 'GESTOR'].includes(user?.perfil);

  useEffect(() => {
    if (!isOpen || !activeSessionId || !user || insightsRequestedRef.current.has(activeSessionId)) return;

    const session = sessions.find(item => item.id === activeSessionId);
    const shouldLoadInsight = session?.proactiveInsightPending
      || (session?.messages.length === 1 && session.messages[0].sender === 'ai');
    if (!session || !shouldLoadInsight) return;

    insightsRequestedRef.current.add(activeSessionId);
    setIsTyping(true);
    chatService.insights()
      .then(response => {
        const data = response.data;
        appendMessageToSession(activeSessionId, {
          id: Date.now(),
          sender: 'ai',
          text: data.summary,
          hasInsights: data.hasInsights,
          topics: data.topics || [],
          proactiveInsight: true,
        });
      })
      .catch(() => {
        appendMessageToSession(activeSessionId, {
          id: Date.now(),
          sender: 'ai',
          text: 'Não consegui preparar seu resumo agora. Você ainda pode conversar normalmente com a Luna.',
          proactiveInsight: true,
        });
      })
      .finally(() => setIsTyping(false));
  }, [isOpen, activeSessionId, sessions, user]);

  const handleSend = (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text
    };

    const updatedMessages = [...messages, userMsg];
    updateSessionMessages(updatedMessages, true);
    if (!textToSend) setInput('');

    setTimeout(() => {
      processQuery(text.toLowerCase(), updatedMessages);
    }, 600);
  };

  const processQuery = async (normalizedText, currentMessages) => {
    setIsTyping(true);
    
    try {
      const response = await chatService.ask(normalizedText);
      const data = response.data;
      
      const aiMsg = {
        id: Date.now(),
        sender: 'ai',
        text: data.reply
      };
      
      updateSessionMessages([...currentMessages, aiMsg]);
    } catch (error) {
      console.error(error);
      updateSessionMessages([...currentMessages, {
        id: Date.now(),
        sender: 'ai',
        text: "Desculpe, estou com instabilidade nos meus servidores neurais no momento. Tente novamente mais tarde."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderRichContent = (msg) => {
    if (!msg.contentType) return null;
    switch (msg.contentType) {
      case 'map_button':
        return (
          <button onClick={() => { setIsOpen(false); navigate('/admin/mapa'); }} className={styles.actionLinkBtn}>
            <MapPin size={14} /> Ver no Mapa de Ocorrências <ChevronRight size={14} />
          </button>
        );
      case 'solicitacoes_button':
        return (
          <button onClick={() => { setIsOpen(false); navigate('/admin/solicitacoes'); }} className={styles.actionLinkBtn}>
            <CheckCircle size={14} /> Acessar Lista de Solicitações <ChevronRight size={14} />
          </button>
        );
      case 'equipes_button':
        return (
          <button onClick={() => { setIsOpen(false); navigate('/admin/equipes'); }} className={styles.actionLinkBtn}>
            <Shield size={14} /> Ir para Gestão de Equipes <ChevronRight size={14} />
          </button>
        );
      case 'nova_solicitacao_button':
        return (
          <button onClick={() => { setIsOpen(false); navigate('/app/nova-solicitacao'); }} className={styles.actionLinkBtn}>
            <CheckCircle size={14} /> Abrir Nova Solicitação <ChevronRight size={14} />
          </button>
        );
      default:
        return null;
    }
  };

  const isAuthPage = ['/login', '/cadastro'].includes(location.pathname);
  if (!user || isAuthPage) return null;

  return (
    <>
      <div 
        className={[styles.avatarWrapper, !isCitizenPage ? styles.adminPosition : ''].join(' ')}
        style={{ bottom: !isCitizenPage ? undefined : '72px', top: !isCitizenPage ? undefined : 'auto' }}
      >
        {!isOpen && <div className={styles.speechBubble}>Perguntar à Luna</div>}
        <button className={styles.triggerBtn} onClick={() => setIsOpen(!isOpen)} title="Perguntar à Luna">
          <img src="/avatar_ai.png" alt="Luna" className={styles.avatarImg} />
        </button>
      </div>

      {isOpen && (
        <Rnd
          default={{
            x: Math.max(0, window.innerWidth - windowSize.width - 24),
            y: Math.max(24, window.innerHeight - windowSize.height - (!isCitizenPage ? 90 : 140)),
            width: windowSize.width,
            height: windowSize.height
          }}
          minWidth={320}
          minHeight={400}
          bounds="window"
          dragHandleClassName="luna-drag-handle"
          className={styles.rndChatWindow}
          style={{ position: 'fixed', zIndex: 9998 }}
        >
          <div className={styles.chatWindowInner}>
            
            {/* Sidebar Histórico */}
            <div className={`${styles.sidebar} ${showSidebar ? styles.sidebarOpen : ''}`}>
              <div className={styles.sidebarHeader}>
                <h4>Conversas</h4>
                <button onClick={() => setShowSidebar(false)} className={styles.closeSidebarBtn}><X size={16}/></button>
              </div>
              
              <button className={styles.newChatBtn} onClick={handleNewChat}>
                <PlusSquare size={16}/> Novo Chat
              </button>

              <div className={styles.sessionList}>
                {sessions.map(s => (
                  <div 
                    key={s.id} 
                    className={`${styles.sessionItem} ${s.id === activeSessionId ? styles.sessionActive : ''}`}
                    onClick={() => handleSwitchChat(s.id)}
                  >
                    <MessageSquare size={14} />
                    <span className={styles.sessionTitle}>{s.title}</span>
                    <button className={styles.deleteChatBtn} onClick={(e) => deleteChat(e, s.id)} title="Excluir"><X size={12}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Header Arrastável */}
            <header className={`luna-drag-handle ${styles.header}`}>
              <div className={styles.headerInfo}>
                <button className={styles.menuBtn} onClick={() => setShowSidebar(!showSidebar)}>
                  <Menu size={20} />
                </button>
                <div className={styles.headerAvatar}><img src="/avatar_ai.png" alt="Luna" className={styles.headerAvatarImg} /></div>
                <div>
                  <h3 className={styles.headerTitle}>Luna</h3>
                  <div className={styles.statusWrapper}><span className={styles.statusDot} /><span>Online</span></div>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}><X size={20} /></button>
            </header>

            {/* Área de Mensagens */}
            <div className={styles.messageList}>
              {messages.map(msg => (
                <div key={msg.id} className={`${styles.messageItem} ${msg.sender === 'ai' ? styles.aiMessage : styles.userMessage}`}>
                  {msg.sender === 'ai' && (
                    <div className={styles.botThumb}><img src="/avatar_ai.png" alt="Luna" className={styles.botThumbImg} /></div>
                  )}
                  <div className={styles.bubble}>
                    {msg.topics?.length > 0 && <h4 className={styles.insightSummaryTitle}>Resumo inicial</h4>}
                    <div className={styles.markdownContent}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    {msg.topics?.length > 0 && (
                      <div className={styles.insightTopics} aria-label="Tópicos do resumo proativo">
                        {msg.topics.map((topic, index) => {
                          const topicId = `${msg.id}-${index}`;
                          const isExpanded = expandedInsightTopic === topicId;
                          return (
                            <div className={styles.insightTopic} key={topicId}>
                              <button
                                className={styles.insightTopicToggle}
                                aria-expanded={isExpanded}
                                aria-controls={`insight-detail-${topicId}`}
                                onClick={() => setExpandedInsightTopic(isExpanded ? null : topicId)}
                              >
                                <span>{topic.title}</span>
                                <ChevronRight className={isExpanded ? styles.insightChevronOpen : ''} size={16} />
                              </button>
                              {isExpanded && (
                                <div className={styles.insightTopicDetail} id={`insight-detail-${topicId}`}>
                                  <p className={styles.insightTopicDescription}>{topic.detail}</p>
                                  {topic.headers?.length > 0 && topic.rows?.length > 0 && (
                                    <div className={styles.insightTableWrap}>
                                      <table className={styles.insightTable}>
                                        <thead>
                                          <tr>
                                            {topic.headers.map(header => <th key={header}>{header}</th>)}
                                            {canOpenInsightOccurrences && topic.occurrenceIds?.length > 0 && <th>Ação</th>}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {topic.rows.map((row, rowIndex) => (
                                            <tr key={`${topicId}-row-${rowIndex}`}>
                                              {row.map((cell, cellIndex) => <td key={`${topicId}-${rowIndex}-${cellIndex}`}>{cell}</td>)}
                                              {canOpenInsightOccurrences && topic.occurrenceIds?.[rowIndex] && (
                                                <td>
                                                  {['CITIZEN', 'ADMIN', 'GESTOR'].includes(user?.perfil) && (
                                                    <button
                                                      className={styles.insightInlineLink}
                                                      onClick={() => openInsightOccurrence(topic.occurrenceIds[rowIndex])}
                                                    >
                                                      Abrir
                                                    </button>
                                                  )}
                                                </td>
                                              )}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                  {topic.destination && topic.linkLabel && (
                                    <button
                                      className={styles.insightDestination}
                                      onClick={() => openInsightDestination(topic.destination)}
                                    >
                                      {topic.linkLabel} <ChevronRight size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {renderRichContent(msg)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className={`${styles.messageItem} ${styles.aiMessage}`}>
                  <div className={styles.botThumb}><img src="/avatar_ai.png" alt="Luna" className={styles.botThumbImg} /></div>
                  <div className={styles.bubble}>
                    <div className={styles.typingIndicator}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Input e Sugestões */}
            <div className={styles.bottomArea}>
              {messages.length <= 1 && (
                <div className={styles.suggestions}>
                  {suggestions.map((pill, idx) => (
                    <button key={idx} className={styles.pill} onClick={() => handleSend(pill.text)}>{pill.label}</button>
                  ))}
                </div>
              )}

              <form className={styles.inputForm} onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                <input 
                  type="text" 
                  placeholder="Digite sua dúvida..." 
                  className={styles.textInput} 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                />
                <button type="submit" className={styles.sendBtn} disabled={!input.trim()}><Send size={18} /></button>
              </form>
            </div>
            
          </div>
        </Rnd>
      )}
    </>
  );
}
