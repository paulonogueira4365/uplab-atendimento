<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  // Interfaces para o TypeScript não reclamar do tipo 'unknown'
  interface Log {
    motivo: string;
    status_destino: string;
  }

  interface Usuario {
    status: string;
  }

  interface ResumoMotivos {
    [key: string]: number;
  }

  let logs: Log[] = [];
  let usuarios: Usuario[] = [];
  let carregando = true;
  let motivosAgrupados: [string, number][] = [];
  
  let chartStatusCanvas: HTMLCanvasElement;
  let chartMotivosCanvas: HTMLCanvasElement;

  onMount(async () => {
    await buscarDados();
    renderizarGraficos();
  });

  async function buscarDados() {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Busca status atual
    const { data: users } = await supabase.from('usuarios').select('status');
    usuarios = (users as Usuario[]) || [];

    // Busca logs de hoje
    const { data: hist } = await supabase
      .from('historico_status')
      .select('motivo, status_destino')
      .gte('criado_em', `${hoje}T00:00:00`);
    
    logs = (hist as Log[]) || [];

    // Processa os motivos para a tabela (ajuda o TS a entender os tipos)
    const contagem = logs.reduce((acc: ResumoMotivos, curr: Log) => {
      if (curr.status_destino === 'pausa' && curr.motivo) {
        acc[curr.motivo] = (acc[curr.motivo] || 0) + 1;
      }
      return acc;
    }, {});

    motivosAgrupados = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    
    carregando = false;
  }

  function renderizarGraficos() {
    if (!chartStatusCanvas || !chartMotivosCanvas) return;

    const statusCounts = {
      disponível: usuarios.filter(u => u.status === 'disponível').length,
      pausa: usuarios.filter(u => u.status === 'pausa').length,
      almoço: usuarios.filter(u => u.status === 'almoço').length,
      offline: usuarios.filter(u => u.status === 'offline').length
    };

    new Chart(chartStatusCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Disponível', 'Pausa', 'Almoço', 'Offline'],
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#94a3b8'],
          borderWidth: 0
        }]
      },
      options: { plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
    });

    new Chart(chartMotivosCanvas, {
      type: 'bar',
      data: {
        labels: motivosAgrupados.map(m => m[0]),
        datasets: [{
          label: 'Frequência',
          data: motivosAgrupados.map(m => m[1]),
          backgroundColor: '#0f172a',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, grid: { display: false } } }
      }
    });
  }
</script>

<div class="dashboard-visual">
  <header class="dash-header">
    <div class="title">
      <h1>Dashboard Analítico UPLAB</h1>
      <p>Visão gerencial da produtividade e disponibilidade da equipe.</p>
    </div>
    <button class="btn-print" on:click={() => window.print()}>Gerar Relatório PDF</button>
  </header>

  <div class="metrics-grid">
    <div class="chart-card">
      <div class="card-info">
        <h3>Status da Operação</h3>
        <span>Distribuição em tempo real</span>
      </div>
      <div class="canvas-container">
        <canvas bind:this={chartStatusCanvas}></canvas>
      </div>
    </div>

    <div class="chart-card">
      <div class="card-info">
        <h3>Motivos de Saída</h3>
        <span>Frequência de pausas hoje</span>
      </div>
      <div class="canvas-container">
        <canvas bind:this={chartMotivosCanvas}></canvas>
      </div>
    </div>
  </div>

  <section class="summary-list">
    <div class="list-header">
      <h2>Ranking de Motivos (Pausas)</h2>
    </div>
    <div class="stats-table">
      {#each motivosAgrupados as [motivo, qtd]}
        <div class="row">
          <span class="motivo">{motivo}</span>
          <span class="bar-container">
            <div class="bar" style="width: {Math.min(qtd * 10, 100)}%"></div>
          </span>
          <span class="qtd">{qtd} registros</span>
        </div>
      {/each}
      
      {#if motivosAgrupados.length === 0}
        <p class="empty-msg">Nenhuma pausa registrada hoje.</p>
      {/if}
    </div>
  </section>
</div>

<style>
  .dashboard-visual { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
  
  .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
  .title h1 { font-size: 1.8rem; color: #0f172a; margin: 0; font-weight: 800; }
  .title p { color: #64748b; font-size: 0.9rem; }

  .btn-print { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.8rem; }

  .metrics-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; margin-bottom: 40px; }
  
  .chart-card { background: white; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; }
  .card-info h3 { margin: 0; color: #1e293b; font-size: 1.1rem; }
  .card-info span { color: #94a3b8; font-size: 0.8rem; }

  .canvas-container { height: 280px; width: 100%; margin-top: 20px; display: flex; justify-content: center; }

  .summary-list { background: white; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; }
  .list-header h2 { font-size: 1rem; color: #1e293b; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }

  .row { display: flex; align-items: center; gap: 20px; padding: 12px 0; border-bottom: 1px solid #f8fafc; }
  .motivo { width: 180px; font-weight: 700; font-size: 0.85rem; color: #475569; }
  .bar-container { flex: 1; height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
  .bar { height: 100%; background: #2563eb; }
  .qtd { font-size: 0.85rem; font-weight: 600; color: #94a3b8; width: 100px; text-align: right; }

  .empty-msg { text-align: center; color: #94a3b8; padding: 20px; }

  @media print {
    .btn-print { display: none; }
    .metrics-grid { grid-template-columns: 1fr 1fr; }
  }
</style>