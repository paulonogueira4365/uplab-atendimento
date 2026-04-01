<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  interface LogStatus {
    id: string;
    status_destino: string;
    motivo: string;
    criado_em: string;
  }

  let userId = '';
  let nome = '';
  let historico: LogStatus[] = [];
  let dataFiltro = new Date().toISOString().split('T')[0]; // Padrão: hoje
  let carregando = true;

  onMount(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      const user = JSON.parse(session);
      userId = user.id;
      nome = user.nome;
      buscarHistorico();
    }
  });

  async function buscarHistorico() {
    carregando = true;
    
    // Filtramos pelo ID do usuário logado e pela data selecionada
    const { data, error } = await supabase
      .from('historico_status')
      .select('id, status_destino, motivo, criado_em')
      .eq('usuario_id', userId)
      .gte('criado_em', `${dataFiltro}T00:00:00`)
      .lte('criado_em', `${dataFiltro}T23:59:59`)
      .order('criado_em', { ascending: false });

    if (!error) {
      historico = data || [];
    }
    carregando = false;
  }

  function formatarHora(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function getStatusClass(status: string) {
    if (status === 'disponível') return 'status-online';
    if (status === 'pausa') return 'status-pause';
    if (status === 'almoço') return 'status-break';
    return 'status-offline';
  }
</script>

<div class="user-dashboard">
  <header class="dash-header">
    <div class="welcome">
      <h1>Meu Histórico</h1>
      <p>Olá, <strong>{nome}</strong>. Confira seus registros de hoje ou filtre por data.</p>
    </div>

    <div class="filter-box">
      <label for="data">Filtrar por dia:</label>
      <div class="input-group">
        <input type="date" id="data" bind:value={dataFiltro} on:change={buscarHistorico} />
        <button on:click={buscarHistorico} disabled={carregando}>
          {carregando ? '...' : '🔍'}
        </button>
      </div>
    </div>
  </header>

  <section class="summary-cards">
    <div class="card">
      <span class="card-label">Registros no dia</span>
      <span class="card-value">{historico.length}</span>
    </div>
    <div class="card">
      <span class="card-label">Primeiro Check-in</span>
      <span class="card-value">
        {historico.length > 0 ? formatarHora(historico[historico.length - 1].criado_em) : '--:--'}
      </span>
    </div>
  </section>

  <div class="table-container">
    {#if carregando}
      <div class="loading-state">Carregando seus registros...</div>
    {:else if historico.length === 0}
      <div class="empty-state">Nenhum registro encontrado para esta data.</div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Horário</th>
            <th>Evento / Status</th>
            <th>Observação / Motivo</th>
          </tr>
        </thead>
        <tbody>
          {#each historico as log}
            <tr>
              <td class="time-col">{formatarHora(log.criado_em)}</td>
              <td>
                <span class="status-tag {getStatusClass(log.status_destino)}">
                  {log.status_destino.replace('_', ' ')}
                </span>
              </td>
              <td class="motivo-col">{log.motivo || '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .user-dashboard { max-width: 900px; margin: 30px auto; padding: 0 20px; }

  .dash-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-end; 
    margin-bottom: 30px;
    background: white;
    padding: 25px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
  }

  .welcome h1 { font-size: 1.5rem; color: #0f172a; margin: 0; }
  .welcome p { color: #64748b; font-size: 0.9rem; margin-top: 5px; }

  .filter-box label { display: block; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 5px; text-transform: uppercase; }
  .input-group { display: flex; gap: 8px; }
  input[type="date"] { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }
  .input-group button { background: #2563eb; color: white; border: none; padding: 0 15px; border-radius: 8px; cursor: pointer; }

  .summary-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
  .card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
  .card-label { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
  .card-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }

  .table-container { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f8fafc; text-align: left; padding: 15px; font-size: 0.75rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
  td { padding: 15px; border-bottom: 1px solid #f8fafc; font-size: 0.9rem; color: #334155; }

  .time-col { font-weight: 700; color: #0f172a; width: 100px; }
  .motivo-col { font-style: italic; color: #64748b; }

  .status-tag { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
  .status-online { background: #dcfce7; color: #15803d; }
  .status-pause { background: #e0f2fe; color: #0369a1; }
  .status-break { background: #fef9c3; color: #a16207; }
  .status-offline { background: #f1f5f9; color: #475569; }

  .loading-state, .empty-state { padding: 40px; text-align: center; color: #94a3b8; }
</style>