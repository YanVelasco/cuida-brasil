import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Send, X, ChevronRight, MapPin, CheckCircle, Shield 
} from 'lucide-react';
import styles from './AIChatbot.module.css';

export default function AIChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentCpf, setCurrentCpf] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);

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

  useEffect(() => {
    if (user && user.cpf !== currentCpf) {
      const key = `cuidar_chatbot_history_${user.cpf}`;
      const saved = localStorage.getItem(key);
      let loadedMessages = [];

      if (saved) {
        try {
          loadedMessages = JSON.parse(saved);
        } catch (e) {
          console.error("Erro ao ler historico do chatbot", e);
        }
      }

      if (loadedMessages.length === 0) {
        const welcomeText = isAdmin
          ? `Olá, Administrador ${user.nome}! Sou a Luna, sua assistente de IA integrada ao painel do Cuidar+ Brasil. Posso fornecer resumos rápidos de métricas, equipes e chamados de urgência. Como posso ajudar hoje?`
          : isGestor
          ? `Olá, Gestor(a) ${user.nome}! Sou a Luna, sua assistente de IA do Cuidar+ Brasil. Posso te auxiliar com as solicitações pendentes de zeladoria, status de equipes de campo e prazos de SLA do seu órgão. Como posso ajudar hoje?`
          : `Olá, ${user.nome}! Sou a Luna, sua assistente virtual do Cuidar+ Brasil. Posso te ajudar a acompanhar suas solicitações ou criar um novo chamado na plataforma. Como posso ajudar?`;

        loadedMessages = [
          {
            id: 1,
            sender: 'ai',
            text: welcomeText
          }
        ];
        localStorage.setItem(key, JSON.stringify(loadedMessages));
      }

      setMessages(loadedMessages);
      setCurrentCpf(user.cpf);
    }
  }, [user, currentCpf, isAdmin, isGestor]);

  useEffect(() => {
    if (user && user.cpf === currentCpf && messages.length > 0) {
      const key = `cuidar_chatbot_history_${user.cpf}`;
      localStorage.setItem(key, JSON.stringify(messages));
    }
  }, [messages, user, currentCpf]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');

    setTimeout(() => {
      processQuery(text.toLowerCase());
    }, 600);
  };

  const processQuery = async (normalizedText) => {
    setIsTyping(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Se houver JWT
        },
        body: JSON.stringify({
          message: normalizedText,
          perfil: user?.perfil || 'CITIZEN',
          usuarioId: String(user?.id)
        })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a IA');
      }

      const data = await response.json();
      
      const aiMsg = {
        id: Date.now(),
        sender: 'ai',
        text: data.reply
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
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
      case 'kpi':
        return (
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard} style={{ background: '#7e8b9b' }}>
              <span className={styles.kpiCardName}>TOTAL ABERTAS</span>
              <span className={styles.kpiCardVal}>532</span>
            </div>
            <div className={styles.kpiCard} style={{ background: 'var(--primary)' }}>
              <span className={styles.kpiCardName}>EM ANDAMENTO</span>
              <span className={styles.kpiCardVal}>210</span>
            </div>
            <div className={styles.kpiCard} style={{ background: 'var(--success)' }}>
              <span className={styles.kpiCardName}>RESOLVIDAS HOJE</span>
              <span className={styles.kpiCardVal}>124</span>
            </div>
            <div className={styles.kpiCard} style={{ background: 'var(--warning)' }}>
              <span className={styles.kpiCardName}>PENDENTES SLA</span>
              <span className={styles.kpiCardVal}>184</span>
            </div>
            <div className={styles.kpiCard} style={{ background: 'var(--danger)', gridColumn: 'span 2' }}>
              <span className={styles.kpiCardName}>⚠️ CASOS URGENTES</span>
              <span className={styles.kpiCardVal}>14</span>
            </div>
          </div>
        );
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

  if (!user) return null;

  return (
    <>
      {/* Floating Button / Avatar Wrapper */}
      <div 
        className={[styles.avatarWrapper, !isCitizenPage ? styles.adminPosition : ''].join(' ')}
        style={{ 
          bottom: !isCitizenPage ? undefined : '72px',
          top: !isCitizenPage ? undefined : 'auto'
        }}
      >
        {!isOpen && (
          <div className={styles.speechBubble}>
            Perguntar à Luna
          </div>
        )}
        <button className={styles.triggerBtn} onClick={() => setIsOpen(!isOpen)} title="Perguntar à Luna">
          <img src="/avatar_ai.png" alt="Perguntar à Luna" className={styles.avatarImg} />
        </button>
      </div>

      {isOpen && (
        <div 
          className={[styles.chatWindow, !isCitizenPage ? styles.adminChatPosition : ''].join(' ')}
          style={{ 
            bottom: !isCitizenPage ? undefined : '138px',
            top: !isCitizenPage ? undefined : 'auto'
          }}
        >


          <header className={styles.header}>



            <div className={styles.headerInfo}>
              <div className={styles.headerAvatar}><img src="/avatar_ai.png" alt="Luna" className={styles.headerAvatarImg} /></div>
              <div>
                <h3 className={styles.headerTitle}>Luna</h3>
                <div className={styles.statusWrapper}><span className={styles.statusDot} /><span>Online</span></div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}><X size={20} /></button>
          </header>

          <div className={styles.messageList}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.messageItem} ${msg.sender === 'ai' ? styles.aiMessage : styles.userMessage}`}>
                {msg.sender === 'ai' && (
                  <div className={styles.botThumb}><img src="/avatar_ai.png" alt="Luna" className={styles.botThumbImg} /></div>
                )}
                <div className={styles.bubble}>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
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

          <div className={styles.suggestions}>
            {suggestions.map((pill, idx) => (
              <button key={idx} className={styles.pill} onClick={() => handleSend(pill.text)}>{pill.label}</button>
            ))}
          </div>

          <form className={styles.inputForm} onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <input type="text" placeholder="Digite sua dúvida..." className={styles.textInput} value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" className={styles.sendBtn} disabled={!input.trim()}><Send size={18} /></button>
          </form>
        </div>
      )}
    </>
  );
}
