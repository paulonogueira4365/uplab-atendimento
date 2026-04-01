<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let equipe: any[] = [];
  let agora = new Date();

  onMount(() => {
    buscar();
    const i = setInterval(() => {
      agora = new Date();
      buscar();
    }, 15000);
    return () => clearInterval(i);
  });

  async function buscar() {
    const { data } = await supabase
      .from('usuarios')
      .select('nome, status, carteira, ultima_atividade')
      .order('status');
    if (data) equipe = data;
  }

  function calcularMinutos(iso: string) {
    if (!iso) return 0;
    return Math.floor((agora.getTime() - new Date(iso).getTime()) / 60000);
  }

  // Lógica de Alerta Visual
  const eCritico = (s: string, iso: string) => (s === 'pausa' && calcularMinutos(iso) > 15) || (s === 'almoço' && calcularMinutos(iso) > 60);

  $: online = equipe.filter(u => u.status === 'disponível').length;
  $: total = equipe.length;
  $: percOnline = total > 0 ? (online / total) * 100 : 0;
</script>

<div class="dash-container">
  <section class="top-stats">
    <div class="main-chart">
      <div class="circle-progress" style="--perc: {percOnline}%">
        <span class="big-number">{online}</span>
        <span class="label">ONLINE AGORA</span>
      </div>
    </div>
    
    <div class="cards-resumo">
      <div class="mini-card verde">
        <span class="val">{online}</span>
        <span class="tit">Disponíveis</span>
      </div>
      <div class="mini-card azul">
        <span class="val">{equipe.filter(u => u.status === 'pausa').length}</span>
        <span class="tit">Em Pausa</span>
      </div>
      <div class="mini-card alerta">
        <span class="val">{equipe.filter(u => eCritico(u.status, u.ultima_atividade)).length}</span>
        <span class="tit">Excederam o Tempo</span>
      </div>
    </div>
  </section>

  <section class="equipe-grid">
    {#each equipe as u}
      <div class="user-card {u.status}" class:critico={eCritico(u.status, u.ultima_atividade)}>
        <div class="user-header">
          <strong>{u.nome}</strong>
          <span class="tag-carteira">{u.carteira || 'Geral'}</span>
        </div>
        
        <div class="user-body">
          <div class="status-line">
            <span class="dot"></span>
            <span class="status-text">{u.status}</span>
          </div>
          <div class="time-counter">
            {calcularMinutos(u.ultima_atividade)} min
          </div>
        </div>

        {#if eCritico(u.status, u.ultima_atividade)}
          <button class="btn-cobrar" on:click={() => alert('Cobrança enviada!')}>COBRAR AGORA</button>
        {/if}
      </div>
    {/each}
  </section>
</div>

<style>
  .dash-container { max-width: 1200px; margin: 0 auto; padding: 10px; }

  /* Topo com Gráfico de Rosca Simples */
  .top-stats { display: grid; grid-template-columns: 300px 1fr; gap: 20px; margin-bottom: 30px; background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  
  .circle-progress { 
    width: 180px; height: 180px; border-radius: 50%; 
    background: conic-gradient(#10b981 var(--perc), #f1f5f9 0);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    position: relative; border: 15px solid white; box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
  }
  .big-number { font-size: 3rem; font-weight: 900; color: #0f172a; line-height: 1; }
  .label { font-size: 0.7rem; font-weight: 800; color: #64748b; }

  .cards-resumo { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
  .mini-card { padding: 20px; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; }
  .mini-card.verde { background: #ecfdf5; color: #065f46; border-left: 5px solid #10b981; }
  .mini-card.azul { background: #eff6ff; color: #1e40af; border-left: 5px solid #3b82f6; }
  .mini-card.alerta { background: #fff1f2; color: #9f1239; border-left: 5px solid #e11d48; }
  .mini-card .val { font-size: 2rem; font-weight: 900; }
  .mini-card .tit { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }

  /* Grid de Usuários */
  .equipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 15px; }
  
  .user-card { background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; transition: 0.2s; }
  .user-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .user-header strong { font-size: 1rem; color: #0f172a; }
  .tag-carteira { font-size: 0.65rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #64748b; font-weight: 700; }

  .user-body { display: flex; justify-content: space-between; align-items: center; }
  .status-line { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; }
  
  .disponível .dot { background: #10b981; box-shadow: 0 0 8px #10b981; }
  .pausa .dot { background: #3b82f6; }
  .almoço .dot { background: #eab308; }

  .time-counter { font-family: monospace; font-size: 1.1rem; font-weight: 800; color: #1e293b; }

  /* Estilo de Alerta Crítico */
  .critico { border: 2px solid #e11d48; background: #fff1f2; animation: blink 2s infinite; }
  .btn-cobrar { width: 100%; margin-top: 12px; padding: 8px; background: #e11d48; color: white; border: none; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.75rem; }

  @keyframes blink { 0% { box-shadow: 0 0 0px rgba(225, 29, 72, 0); } 50% { box-shadow: 0 0 15px rgba(225, 29, 72, 0.3); } 100% { box-shadow: 0 0 0px rgba(225, 29, 72, 0); } }
</style>