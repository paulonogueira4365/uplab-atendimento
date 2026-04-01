<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let userId = '';
  let nome = '';
  let statusAtual = 'offline';
  let carregando = false;
  
  // Controle do Modal de Pausa
  let mostrarModalMotivo = false;
  let statusTemporario = '';
  let motivoPersonalizado = '';
  const motivosPreDefinidos = ['Fazendo Malote', 'Reunião', 'Treinamento', 'Banheiro / Água', 'Feedback'];

  onMount(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      const user = JSON.parse(session);
      userId = user.id;
      nome = user.nome;
      statusAtual = user.status || 'offline';
    }
  });

  async function mudarStatus(novoStatus: string, motivo: string = '') {
    // Se for uma pausa e não tiver motivo, abre o modal
    if (novoStatus === 'pausa' && !motivo) {
      statusTemporario = novoStatus;
      mostrarModalMotivo = true;
      return;
    }

    carregando = true;
    const dataHora = new Date().toISOString();

    // 1. Atualiza o status atual do Usuário
    const { error: errorUser } = await supabase
      .from('usuarios')
      .update({ 
        status: novoStatus, 
        ultima_atividade: dataHora 
      })
      .eq('id', userId);

    // 2. Grava no Histórico para Relatórios
    const { error: errorLog } = await supabase
      .from('historico_status')
      .insert([{
        usuario_id: userId,
        nome_usuario: nome,
        status_origem: statusAtual,
        status_destino: novoStatus,
        motivo: motivo || (novoStatus === 'disponível' ? 'Retorno ao trabalho' : ''),
      }]);

    if (!errorUser && !errorLog) {
      statusAtual = novoStatus;
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      session.status = novoStatus;
      localStorage.setItem('user_session', JSON.stringify(session));
      fecharModal();
    }
    carregando = false;
  }

  function fecharModal() {
    mostrarModalMotivo = false;
    motivoPersonalizado = '';
    statusTemporario = '';
  }
</script>

<div class="status-page">
  <div class="status-card">
    <header>
      <h1>Olá, {nome}</h1>
      <p>Gerencie sua disponibilidade na UPLAB</p>
    </header>

    <div class="current-badge {statusAtual}">
      Status: <strong>{statusAtual.replace('_', ' ').toUpperCase()}</strong>
    </div>

    <div class="actions">
      <button 
        class="btn-status online" 
        disabled={statusAtual === 'disponível' || carregando}
        on:click={() => mudarStatus('disponível')}>
        ✅ FICAR DISPONÍVEL
      </button>

      <button 
        class="btn-status pause" 
        disabled={statusAtual === 'pausa' || carregando}
        on:click={() => mudarStatus('pausa')}>
        ☕ INICIAR PAUSA / MOTIVO
      </button>

      <button 
        class="btn-status break" 
        disabled={statusAtual === 'almoço' || carregando}
        on:click={() => mudarStatus('almoço', 'Horário de Almoço')}>
        🍴 SAIR PARA ALMOÇO
      </button>

      <button 
        class="btn-status offline" 
        disabled={statusAtual === 'offline' || carregando}
        on:click={() => mudarStatus('offline', 'Encerramento')}>
        🏁 ENCERRAR EXPEDIENTE
      </button>
    </div>
  </div>
</div>

{#if mostrarModalMotivo}
<div class="modal-overlay">
  <div class="modal">
    <h3>Motivo da Pausa</h3>
    <p>Selecione ou digite por que você está saindo da operação:</p>

    <div class="motivos-grid">
      {#each motivosPreDefinidos as m}
        <button on:click={() => mudarStatus('pausa', m)}>{m}</button>
      {/each}
    </div>

    <div class="custom-motivo">
      <input type="text" bind:value={motivoPersonalizado} placeholder="Outro motivo..." />
      <button 
        class="btn-send" 
        disabled={!motivoPersonalizado} 
        on:click={() => mudarStatus('pausa', motivoPersonalizado)}>
        Confirmar Outro
      </button>
    </div>

    <button class="btn-cancel" on:click={fecharModal}>Cancelar</button>
  </div>
</div>
{/if}

<style>
  /* Reaproveitando sua base e adicionando o novo */
  .status-page { display: flex; justify-content: center; align-items: center; height: 85vh; padding: 20px; }
  .status-card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); width: 100%; max-width: 450px; text-align: center; border: 1px solid #e2e8f0; }
  
  header h1 { color: #0f172a; margin: 0; font-size: 1.6rem; }
  header p { color: #64748b; margin-top: 5px; font-size: 0.9rem; }

  .current-badge { padding: 12px; border-radius: 10px; margin: 25px 0; font-size: 1rem; border: 1px solid transparent; }
  .current-badge.disponível { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
  .current-badge.pausa { background: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
  .current-badge.almoço { background: #fef9c3; color: #854d0e; border-color: #fef08a; }
  .current-badge.offline { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }

  .actions { display: flex; flex-direction: column; gap: 12px; }
  .btn-status { padding: 16px; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
  
  .online { background: #22c55e; color: white; }
  .pause { background: #3b82f6; color: white; }
  .break { background: #eab308; color: white; }
  .offline { background: #64748b; color: white; }
  
  .btn-status:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
  .btn-status:disabled { opacity: 0.3; cursor: not-allowed; }

  /* MODAL */
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal { background: white; padding: 30px; border-radius: 15px; width: 90%; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
  .modal h3 { margin: 0 0 10px 0; color: #0f172a; }
  .modal p { color: #64748b; font-size: 0.85rem; margin-bottom: 20px; }

  .motivos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .motivos-grid button { padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
  .motivos-grid button:hover { background: #3b82f6; color: white; border-color: #3b82f6; }

  .custom-motivo { display: flex; gap: 5px; margin-bottom: 20px; }
  .custom-motivo input { flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; }
  .btn-send { background: #0f172a; color: white; border: none; padding: 0 15px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }

  .btn-cancel { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem; width: 100%; }
  .btn-cancel:hover { color: #ef4444; }
</style>