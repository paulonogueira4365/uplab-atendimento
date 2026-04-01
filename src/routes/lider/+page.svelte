<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  interface UsuarioSimples {
    nome: string;
    status: string;
    carteira: string;
    ultima_atividade: string;
  }

  let equipe: UsuarioSimples[] = [];
  let carregando = true;

  onMount(() => {
    buscarPresenca();
    // Atualização rápida a cada 15 segundos para o líder não perder nada
    const interval = setInterval(buscarPresenca, 15000);
    return () => clearInterval(interval);
  });

  async function buscarPresenca() {
    const { data } = await supabase
      .from('usuarios')
      .select('nome, status, carteira, ultima_atividade')
      .order('status', { ascending: true });

    if (data) equipe = data;
    carregando = false;
  }

  // Atalhos de contagem
  $: online = equipe.filter(u => u.status === 'disponível').length;
  $: total = equipe.length;
</script>

<div class="quick-view">
  <header class="view-header">
    <div class="info">
      <h1>Presença em Tempo Real</h1>
      <p>Matriz UPLAB • Curitiba</p>
    </div>
    <div class="counter">
      <span class="online-count">{online}</span>
      <span class="total-count">/ {total} Disponíveis</span>
    </div>
  </header>

  {#if carregando}
    <div class="loading">Sincronizando equipe...</div>
  {:else}
    <div class="status-grid">
      {#each equipe as user}
        <div class="user-card {user.status}">
          <div class="status-indicator">
            <div class="dot"></div>
          </div>
          <div class="details">
            <span class="name">{user.nome}</span>
            <span class="carteira">{user.carteira}</span>
          </div>
          <div class="current-status">
            {user.status.toUpperCase()}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .quick-view { max-width: 1000px; margin: 20px auto; padding: 0 20px; }

  .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
  .view-header h1 { font-size: 1.4rem; color: #0f172a; margin: 0; font-weight: 800; }
  .view-header p { color: #64748b; font-size: 0.85rem; margin: 0; }

  .counter { background: #f1f5f9; padding: 8px 16px; border-radius: 12px; display: flex; align-items: baseline; gap: 5px; }
  .online-count { font-size: 1.5rem; font-weight: 900; color: #10b981; }
  .total-count { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

  .status-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }

  /* Estilo do Card */
  .user-card { 
    background: white; 
    border: 1px solid #e2e8f0; 
    padding: 15px; 
    border-radius: 12px; 
    display: flex; 
    align-items: center; 
    gap: 12px;
    position: relative;
    transition: transform 0.2s;
  }
  .user-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

  .details { flex: 1; overflow: hidden; }
  .name { display: block; font-weight: 700; color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .carteira { display: block; font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }

  .current-status { font-size: 0.6rem; font-weight: 800; color: #94a3b8; background: #f8fafc; padding: 2px 6px; border-radius: 4px; }

  /* Indicadores de Status (O Ponto Luminoso) */
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; position: relative; }
  
  /* Online / Disponível */
  .user-card.disponível .dot, .user-card.online .dot { 
    background: #10b981; 
    box-shadow: 0 0 8px #10b981;
  }
  .user-card.disponível .dot::after {
    content: ''; position: absolute; width: 100%; height: 100%; background: #10b981; border-radius: 50%;
    animation: ripple 1.5s infinite;
  }

  /* Pausa */
  .user-card.pausa .dot { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }
  
  /* Almoço */
  .user-card.almoço .dot { background: #eab308; box-shadow: 0 0 8px #eab308; }

  /* Offline */
  .user-card.offline { opacity: 0.6; grayscale: 1; }

  @keyframes ripple {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  .loading { text-align: center; padding: 50px; color: #94a3b8; font-weight: 600; }
</style>