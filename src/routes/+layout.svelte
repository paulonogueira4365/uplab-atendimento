<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let user: any = null;
  let carregando = true;

  onMount(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      user = JSON.parse(session);
      protegerRotas(user);
    } else if ($page.url.pathname !== '/') {
      window.location.href = '/';
    }
    carregando = false;
  });

  function protegerRotas(u: any) {
    const path = $page.url.pathname;
    
    // 1. Bloqueia Atendente de sair da sua rota
    if (u.nivel === 'atendente' && !path.startsWith('/atendimento') && path !== '/') {
      window.location.href = '/atendimento/status';
    }
    
    // 2. Bloqueia Líder de entrar no ADM ou BANCO
    if (u.nivel === 'supervisor' && (path.startsWith('/adm') || path.startsWith('/banco'))) {
      window.location.href = '/lider';
    }

    // 3. Bloqueia qualquer um que não seja diretoria de acessar o BANCO
    if (u.nivel !== 'diretoria' && path.startsWith('/banco')) {
        window.location.href = u.nivel === 'supervisor' ? '/lider' : '/atendimento/status';
    }
  }

  function logout() {
    localStorage.removeItem('user_session');
    window.location.href = '/';
  }
</script>

{#if !carregando}
  {#if user && $page.url.pathname !== '/'}
    <nav class="navbar">
      <div class="nav-container">
        
        <div class="brand">
          <img src="/logo-uplab.jpg" alt="UPLAB" class="logo-img" />
          <div class="brand-text">
            <strong>UPLAB</strong>
            <span class="badge-matriz">MATRIZ</span>
          </div>
        </div>

        <div class="nav-links">
          <a href="/atendimento/status" class:active={$page.url.pathname.includes('/atendimento')}>
            ATENDIMENTO
          </a>

          {#if user.nivel === 'supervisor' || user.nivel === 'diretoria'}
            <div class="dropdown">
              <button class="dropbtn" class:active={$page.url.pathname.includes('/lider')}>LÍDER ▼</button>
              <div class="dropdown-content">
                <a href="/lider">Presença Real-time</a>
                <a href="/lider/dashboard">Dashboard Cobrança</a>
              </div>
            </div>
          {/if}

          {#if user.permissoes?.gerencia || user.nivel === 'diretoria'}
            <div class="dropdown">
              <button class="dropbtn" class:active={$page.url.pathname.includes('/gerencia')}>GERÊNCIA ▼</button>
              <div class="dropdown-content">
                <a href="/gerencia">Logs de Jornada</a>
                <a href="/gerencia/dashboard">Dashboard Analítico</a>
              </div>
            </div>
          {/if}

          {#if user.nivel === 'diretoria'}
            <div class="dropdown">
              <button class="dropbtn adm" class:active={$page.url.pathname.includes('/adm') || $page.url.pathname.includes('/banco')}>
                ADM ▼
              </button>
              <div class="dropdown-content">
                <div class="menu-section">GERAL</div>
                <a href="/adm">Painel Auditoria</a>
                
                <div class="menu-section">SISTEMA</div>
                <a href="/banco/cadastros" class="highlight-item">🗄️ Cadastros de Banco</a>
                
                <div class="menu-section">USUÁRIOS</div>
                <a href="/adm/cadastro">Novo Usuário</a>
                <a href="/adm/edicao">Editar Usuários</a>
                <a href="/adm/permissoes">Gerenciar Acessos</a>
              </div>
            </div>
          {/if}
        </div>

        <div class="user-info">
          <div class="text">
            <strong>{user.nome}</strong>
            <span>{user.nivel.toUpperCase()}</span>
          </div>
          <button class="logout" on:click={logout}>SAIR</button>
        </div>
      </div>
    </nav>
  {/if}

  <main>
    <slot />
  </main>
{/if}

<style>
  :global(body) { margin: 0; font-family: 'Inter', sans-serif; background: #f4f7f9; }
  
  .navbar { background: #fff; border-bottom: 2px solid #e2e8f0; padding: 10px 0; position: sticky; top: 0; z-index: 100; }
  .nav-container { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }

  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-text { display: flex; flex-direction: column; line-height: 1; }
  .brand-text strong { font-size: 1.1rem; color: #0f172a; letter-spacing: -0.5px; }
  .logo-img { height: 32px; border-radius: 4px; }
  .badge-matriz { background: #2563eb; color: white; font-size: 0.55rem; font-weight: 900; padding: 1px 4px; border-radius: 3px; width: fit-content; margin-top: 2px; }

  .nav-links { display: flex; gap: 8px; }
  .nav-links a, .dropbtn { 
    text-decoration: none; color: #64748b; font-size: 0.75rem; font-weight: 800; 
    padding: 8px 12px; border-radius: 6px; border: none; background: none; cursor: pointer;
    transition: all 0.2s;
  }
  .nav-links a:hover, .dropbtn:hover { background: #f1f5f9; color: #1e293b; }
  .active { color: #2563eb !important; background: #eff6ff !important; }

  /* Dropdowns */
  .dropdown { position: relative; }
  .dropdown-content { 
    display: none; position: absolute; top: 100%; right: 0; background: white; 
    min-width: 210px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
    padding: 8px 0;
  }
  .dropdown:hover .dropdown-content { display: block; }
  .dropdown-content a { display: block; padding: 10px 16px; border: none; font-size: 0.75rem; color: #475569; font-weight: 600; }
  .dropdown-content a:hover { background: #f8fafc; color: #2563eb; }

  .menu-section { font-size: 0.6rem; font-weight: 900; color: #94a3b8; padding: 8px 16px 4px; text-transform: uppercase; letter-spacing: 1px; }
  .highlight-item { background: #f0f9ff; color: #0369a1 !important; font-weight: 800 !important; }

  .dropbtn.adm { color: #854d0e; border: 1px solid #fef08a; background: #fefce8; margin-left: 5px; }
  .dropbtn.adm.active { background: #fef9c3 !important; border-color: #eab308 !important; }

  .user-info { display: flex; align-items: center; gap: 12px; padding-left: 15px; border-left: 1px solid #e2e8f0; margin-left: 10px; }
  .user-info .text { text-align: right; line-height: 1.1; }
  .user-info strong { display: block; font-size: 0.8rem; color: #0f172a; }
  .user-info span { font-size: 0.6rem; color: #64748b; font-weight: 700; }

  .logout { background: #fff1f2; color: #e11d48; border: 1px solid #fda4af; padding: 5px 12px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; cursor: pointer; transition: 0.2s; }
  .logout:hover { background: #e11d48; color: white; }

  main { max-width: 1400px; margin: 0 auto; padding: 20px; }
</style>