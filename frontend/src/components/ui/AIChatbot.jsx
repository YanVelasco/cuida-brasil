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

  const processQuery = (normalizedText) => {
    let responseText = '';
    let contentType = null;

    if (isAdmin) {
      if (normalizedText.includes('dashboard') || normalizedText.includes('dados') || normalizedText.includes('estatisticas') || normalizedText.includes('kpi')) {
        responseText = `Com certeza! Aqui estão os dados consolidados do painel do Cuidar+ Brasil atualizados em tempo real:`;
        contentType = 'kpi';
      } else if (normalizedText.includes('urgente') || normalizedText.includes('prioridade alta') || normalizedText.includes('urgencia')) {
        responseText = `Atenção! Temos 14 chamados marcados como Urgentes. Os 3 casos com maior risco de estourar o SLA de atendimento são:\n\n1. 🚨 **#729481** - Pavimentação (Cratera com risco na Av. Rebouças)\n2. 🌳 **#729490** - Poda Urgente (Árvore instável na Rua Pamplona)\n3. 💡 **#729511** - Iluminação (Semáforos apagados no cruzamento da Av. Paulista)`;
        contentType = 'map_button';
      } else if (normalizedText.includes('categoria') || normalizedText.includes('problema') || normalizedText.includes('comum') || normalizedText.includes('tipo')) {
        responseText = `A distribuição percentual das solicitações ativas nesta semana é:\n\n💡 **1. Iluminação Pública** — 32%\n🚗 **2. Pavimentação** — 24%\n🧹 **3. Limpeza Urbana** — 18%\n🌳 **4. Poda & Árvores** — 14%\n⚙️ **5. Outros** — 12%`;
      } else {
        responseText = `Olá! Sou a Luna, sua assistente de inteligência artificial do Cuidar+ Brasil. Como painel administrativo, você pode me pedir dados do dashboard, resumos de categorias ou listar chamados urgentes.`;
      }
    } else if (isGestor) {
      if (normalizedText.includes('pendente') || normalizedText.includes('solicitacao') || normalizedText.includes('chamado') || normalizedText.includes('órgão') || normalizedText.includes('meu')) {
        responseText = `Entendido! Identifiquei 12 solicitações pendentes sob a responsabilidade do seu órgão público nesta semana. A maioria delas refere-se a serviços de Pavimentação e Limpeza Urbana. Deseja ver a lista completa de solicitações atribuídas para despacho?`;
        contentType = 'solicitacoes_button';
      } else if (normalizedText.includes('equipe') || normalizedText.includes('campo') || normalizedText.includes('ativa')) {
        responseText = `Temos 4 equipes de campo ativas na sua região. O status atual de disponibilidade delas é:\n\n• 🟢 **Equipe A (Centro)**: Disponível\n• 🔵 **Equipe B (Zona Sul)**: Em Campo\n• 🟢 **Equipe C (Zona Norte)**: Disponível\n• 🟡 **Equipe D (Zona Leste)**: Retorno à base`;
        contentType = 'equipes_button';
      } else if (normalizedText.includes('urgente') || normalizedText.includes('prioridade') || normalizedText.includes('urgencia')) {
        responseText = `Existem 5 chamados de prioridade Urgente sob a responsabilidade do seu órgão aguardando atendimento imediato:\n\n1. 🚨 **#729481** - Buraco profundo com risco na Av. Rebouças\n2. 🌳 **#729490** - Risco iminente de queda de galho na Rua Pamplona`;
        contentType = 'map_button';
      } else {
        responseText = `Olá! Sou a Luna, sua assistente de IA. Como gestor do portal Cuidar+ Brasil, você pode me pedir informações sobre solicitações pendentes, equipes de campo ou prazos de SLA do seu órgão.`;
      }
    } else {
      if (normalizedText.includes('minhas') || normalizedText.includes('solicitacoes') || normalizedText.includes('chamados') || normalizedText.includes('status') || normalizedText.includes('verificar')) {
        responseText = `Localizei as seguintes solicitações vinculadas ao seu perfil de Cidadão:\n\n🛠️ **Protocolo #729103** - Em Andamento\n🌳 **Protocolo #681024** - Resolvido`;
      } else if (normalizedText.includes('nova') || normalizedText.includes('abrir') || normalizedText.includes('criar') || normalizedText.includes('solicitacao') || normalizedText.includes('pedido')) {
        responseText = `Para criar uma nova solicitação, preencha o formulário informando a localização, tipo de problema e anexe uma foto se possível.`;
        contentType = 'nova_solicitacao_button';
      } else {
        responseText = `Olá! Sou a Luna. O **Cuidar+ Brasil** é o canal direto da nossa prefeitura para que os cidadãos colaborem na manutenção da cidade! Como posso te ajudar hoje?`;
      }
    }

    const aiMsg = {
      id: Date.now(),
      sender: 'ai',
      text: responseText,
      contentType: contentType
    };

    setMessages(prev => [...prev, aiMsg]);
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
