<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  interface LogEquipe {
    id: string;
    nome_usuario: string;
    status_destino: string;
    motivo: string;
    criado_em: string;
  }

  let logs: LogEquipe[] = [];
  let filtroData = new Date().toISOString().split('T')[0];
  let filtroNome = '';
  let carregando = true;

  onMount(buscarLogsEquipe);

  async function buscarLogsEquipe() {
    carregando = true;
    const { data, error } = await supabase
      .from('historico_status')
      .select('*')
      .gte('criado_em', `${filtroData}T00:00:00`)
      .lte('criado_em', `${filtroData}T23:59:59`)
      .order('criado_em', { ascending: false });

    if (data) logs = data;
    carregando = false;
  }

  // Filtro reativo por nome de colaborador
  $: logsFiltrados = logs.filter(l => 
    l.nome_usuario.toLowerCase().includes(filtroNome.toLowerCase())
  );

  function formatarHora(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function getStatusStyle(status: string) {
    switch(status) {
      case 'disponível': return 'bg-green-100 text-green-700 border-green-200';
      case 'pausa': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'almoço': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'offline': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
</script>

<div class="gerencia-container">
  <header class="header-dash">
    <div class="title-section">
      <h1>Monitoramento de Jornada</h1>
      <p>Acompanhamento detalhado de pausas, retornos e atividades da equipe UPLAB.</p>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>Data da Operação</label>
        <input type="date" bind:value={filtroData} on:change={buscarLogsEquipe} />
      </div>
      <div class="filter-group">
        <label>Filtrar Colaborador</label>
        <input type="text" placeholder="Nome do atendente..." bind:value={filtroNome} />
      </div>
      <button class="btn-refresh" on:click={buscarLogsEquipe}>🔄 Atualizar</button>
    </div>
  </header>

  <section class="log-timeline">
    <div class="table-card">
      {#if carregando}
        <div class="loading">Sincronizando dados da equipe...</div>
      {:else if logsFiltrados.length === 0}
        <div class="empty">Nenhum registro encontrado para os filtros selecionados.</div>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Horário</th>
              <th>Colaborador</th>
              <th>Evento / Novo Status</th>
              <th>Motivo Declarado</th>
              <th>Referência</th>
            </tr>
          </thead>
          <tbody>
            {#each logsFiltrados as log}
              <tr class="log-row">
                <td class="time-cell">{formatarHora(log.criado_em)}</td>
                <td class="user-cell">{log.nome_usuario}</td>
                <td>
                  <span class="status-tag {getStatusStyle(log.status_destino)}">
                    {log.status_destino.toUpperCase()}
                  </span>
                </td>
                <td class="motivo-cell">
                  {#if log.motivo}
                    <span class="motivo-text">💬 {log.motivo}</span>
                  {:else}
                    <span class="no-motivo">-</span>
                  {/if}
                </td>
                <td class="id-cell">#{log.id.slice(0,8)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </section>
</div>

<style>
  .gerencia-container { max-width: 1200px; margin: 30px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }

  .header-dash { 
    background: white; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; 
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }

  h1 { font-size: 1.6rem; color: #0f172a; margin: 0; font-weight: 800; }
  p { color: #64748b; font-size: 0.9rem; margin-top: 5px; }

  .filters { display: flex; gap: 20px; align-items: flex-end; }
  .filter-group { display: flex; flex-direction: column; gap: 5px; }
  .filter-group label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
  .filter-group input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; outline: none; }

  .btn-refresh { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
  .btn-refresh:hover { background: #e2e8f0; }

  .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
  
  table { width: 100%; border-collapse: collapse; }
  th { background: #f8fafc; text-align: left; padding: 15px; font-size: 0.7rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
  td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }

  .time-cell { font-weight: 700; color: #2563eb; font-family: monospace; font-size: 1rem; }
  .user-cell { font-weight: 600; color: #1e293b; }
  
  .status-tag { padding: 4px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; border: 1px solid; }
  
  /* Cores das Tags */
  .bg-green-100 { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
  .bg-blue-100 { background: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
  .bg-yellow-100 { background: #fef9c3; color: #a16207; border-color: #fef08a; }
  .bg-gray-100 { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }

  .motivo-cell { max-width: 300px; }
  .motivo-text { font-size: 0.85rem; color: #475569; font-style: italic; }
  .no-motivo { color: #cbd5e1; }
  
  .id-cell { font-size: 0.7rem; color: #94a3b8; font-family: monospace; }

  .loading, .empty { padding: 60px; text-align: center; color: #94a3b8; }
  .log-row:hover { background: #f8fafc; }
</style>