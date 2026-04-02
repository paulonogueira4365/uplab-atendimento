<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let userId = '';
  let nome = '';
  let statusAtual = 'indisponível';
  let carregando = false;

  onMount(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      const user = JSON.parse(session);
      userId = user.id;
      nome = user.nome;
      statusAtual = user.status || 'indisponível';
    }
  });

  async function mudarStatus(novoStatus: string) {
    carregando = true;
    const agora = new Date().toISOString();

    try {
      // 1. Atualiza o Usuário (Isso dispara o Trigger no Banco para os Clientes)
      const { error: errorUser } = await supabase
        .from('usuarios')
        .update({ 
          status: novoStatus, 
          ultima_atividade: agora 
        })
        .eq('id', userId);

      if (errorUser) throw errorUser;

      // 2. Registra no Histórico
      await supabase.from('historico_status').insert([{
        usuario_id: userId,
        nome_usuario: nome,
        status_origem: statusAtual,
        status_destino: novoStatus,
        motivo: novoStatus === 'disponível' ? 'Início de Atendimento' : 'Saída de Operação'
      }]);

      // 3. Atualiza Interface e LocalStorage
      statusAtual = novoStatus;
      const sessionData = JSON.parse(localStorage.getItem('user_session') || '{}');
      sessionData.status = novoStatus;
      localStorage.setItem('user_session', JSON.stringify(sessionData));

    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
    } finally {
      carregando = false;
    }
  }
</script>

<div class="status-container">
  <div class="card">
    <header>
      <h1>{nome}</h1>
      <p>Painel de Disponibilidade UPLAB</p>
    </header>

    <div class="badge {statusAtual}">
      {statusAtual.toUpperCase()}
    </div>

    <div class="actions">
      {#if statusAtual !== 'disponível'}
        <button 
          class="btn btn-online" 
          disabled={carregando} 
          on:click={() => mudarStatus('disponível')}>
          ✅ FICAR DISPONÍVEL
        </button>
      {:else}
        <button 
          class="btn btn-offline" 
          disabled={carregando} 
          on:click={() => mudarStatus('indisponível')}>
          ⛔ FICAR INDISPONÍVEL
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .status-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 70vh;
    padding: 20px;
    font-family: 'Inter', sans-serif;
  }

  .card {
    background: white;
    padding: 40px;
    border-radius: 24px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 380px;
    text-align: center;
    border: 1px solid #e2e8f0;
  }

  h1 { margin: 0; color: #1e293b; font-size: 1.6rem; }
  p { color: #64748b; margin: 5px 0 30px; font-size: 0.9rem; }

  .badge {
    padding: 15px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 1.1rem;
    margin-bottom: 30px;
    letter-spacing: 1px;
  }

  .badge.disponível { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .badge.indisponível { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

  .btn {
    width: 100%;
    padding: 20px;
    border-radius: 14px;
    border: none;
    font-size: 1rem;
    font-weight: 800;
    cursor: pointer;
    transition: 0.2s;
  }

  .btn-online { background: #22c55e; color: white; box-shadow: 0 5px 15px rgba(34, 197, 94, 0.3); }
  .btn-offline { background: #ef4444; color: white; box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3); }

  .btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>