<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  interface Usuario {
    id: string;
    nome: string;
    carteira: string;
    nivel: string;
    senha?: string;
    status: string;
  }

  let usuarios: Usuario[] = [];
  let busca = '';
  let usuarioSelecionado: Usuario | null = null;
  let mensagem = '';
  let carregando = false;

  // Opções para os Selects
  const niveis = ['atendimento', 'supervisor', 'diretoria'];
  const carteiras = ['BERÇÁRIO', 'CLIENTES ANA', 'LABORATÓRIOS', 'QUALIDADE', 'INOVAÇÃO', 'EXCELÊNCIA', 'GERAL'];

  onMount(buscarUsuarios);

  async function buscarUsuarios() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });
    if (data) usuarios = data;
  }

  function selecionarUsuario(u: Usuario) {
    usuarioSelecionado = { ...u }; // Cria uma cópia para não alterar a lista original antes de salvar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function atualizarUsuario() {
    if (!usuarioSelecionado) return;
    carregando = true;

    const { error } = await supabase
      .from('usuarios')
      .update({
        nome: usuarioSelecionado.nome,
        carteira: usuarioSelecionado.carteira,
        nivel: usuarioSelecionado.nivel,
        senha: usuarioSelecionado.senha,
        status: usuarioSelecionado.status
      })
      .eq('id', usuarioSelecionado.id);

    if (error) {
      mensagem = "❌ Erro ao atualizar: " + error.message;
    } else {
      mensagem = "✅ Dados de " + usuarioSelecionado.nome + " atualizados!";
      usuarioSelecionado = null;
      await buscarUsuarios(); // Recarrega a lista
      setTimeout(() => (mensagem = ''), 3000);
    }
    carregando = false;
  }

  // Filtro de busca em tempo real
  $: usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(busca.toLowerCase()) || 
    u.carteira.toLowerCase().includes(busca.toLowerCase())
  );
</script>

<div class="edit-container">
  <header>
    <h1>Gestão de Equipe</h1>
    <p>Edite informações, altere senhas ou mude o nível de acesso dos colaboradores.</p>
  </header>

  {#if mensagem}
    <div class="toast">{mensagem}</div>
  {/if}

  <div class="layout-grid">
    <section class="list-section">
      <div class="search-box">
        <input type="text" placeholder="Buscar por nome ou carteira..." bind:value={busca} />
      </div>

      <div class="user-list">
        {#each usuariosFiltrados as user}
          <button class="user-item" class:active={usuarioSelecionado?.id === user.id} on:click={() => selecionarUsuario(user)}>
            <div class="info">
              <span class="name">{user.nome}</span>
              <span class="sub">{user.carteira} • {user.nivel}</span>
            </div>
            <span class="status-dot {user.status}"></span>
          </button>
        {/each}
      </div>
    </section>

    <section class="form-section">
      {#if usuarioSelecionado}
        <div class="edit-card">
          <h2>Editando: {usuarioSelecionado.nome}</h2>
          
          <div class="field">
            <label>Nome Completo / Identificação</label>
            <input type="text" bind:value={usuarioSelecionado.nome} />
          </div>

          <div class="grid-fields">
            <div class="field">
              <label>Nível de Acesso</label>
              <select bind:value={usuarioSelecionado.nivel}>
                {#each niveis as n} <option value={n}>{n.toUpperCase()}</option> {/each}
              </select>
            </div>

            <div class="field">
              <label>Carteira Principal</label>
              <select bind:value={usuarioSelecionado.carteira}>
                {#each carteiras as c} <option value={c}>{c}</option> {/each}
              </select>
            </div>
          </div>

          <div class="field">
            <label>Senha de Acesso (6 dígitos)</label>
            <input type="password" maxlength="6" bind:value={usuarioSelecionado.senha} placeholder="Digite para alterar" />
          </div>

          <div class="field">
            <label>Status Manual</label>
            <select bind:value={usuarioSelecionado.status}>
              <option value="offline">OFFLINE</option>
              <option value="bloqueado">BLOQUEADO (Sem Acesso)</option>
            </select>
          </div>

          <div class="actions">
            <button class="btn-cancel" on:click={() => usuarioSelecionado = null}>Cancelar</button>
            <button class="btn-save" on:click={atualizarUsuario} disabled={carregando}>
              {carregando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <div class="icon">👤</div>
          <p>Selecione um colaborador ao lado para editar os dados.</p>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .edit-container { max-width: 1100px; margin: 30px auto; padding: 0 20px; }
  header { margin-bottom: 30px; }
  h1 { font-size: 1.8rem; color: #0f172a; margin: 0; }
  p { color: #64748b; font-size: 0.9rem; }

  .layout-grid { display: grid; grid-template-columns: 350px 1fr; gap: 30px; }

  /* Lista */
  .list-section { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; height: 70vh; }
  .search-box { padding: 15px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .search-box input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; }
  
  .user-list { overflow-y: auto; flex: 1; }
  .user-item { 
    width: 100%; padding: 15px; border: none; background: none; border-bottom: 1px solid #f1f5f9; 
    display: flex; justify-content: space-between; align-items: center; cursor: pointer; text-align: left;
    transition: 0.2s;
  }
  .user-item:hover { background: #f0f7ff; }
  .user-item.active { background: #eff6ff; border-left: 4px solid #2563eb; }
  
  .info .name { display: block; font-weight: 700; color: #1e293b; font-size: 0.9rem; }
  .info .sub { font-size: 0.75rem; color: #94a3b8; }

  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }
  .status-dot.online, .status-dot.disponível { background: #22c55e; }
  .status-dot.bloqueado { background: #ef4444; }

  /* Formulário */
  .edit-card { background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .edit-card h2 { font-size: 1.2rem; color: #0f172a; margin-top: 0; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }

  .field { margin-bottom: 18px; }
  label { display: block; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; }
  input, select { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; font-size: 0.9rem; }
  
  .grid-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

  .actions { display: flex; gap: 10px; margin-top: 30px; }
  .btn-save { flex: 2; background: #2563eb; color: white; border: none; padding: 14px; border-radius: 8px; font-weight: 700; cursor: pointer; }
  .btn-cancel { flex: 1; background: #f1f5f9; color: #475569; border: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; }
  
  .btn-save:hover { background: #1d4ed8; }
  .btn-save:disabled { background: #94a3b8; }

  .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 40px; }
  .empty-state .icon { font-size: 3rem; margin-bottom: 10px; opacity: 0.3; }

  .toast { position: fixed; top: 20px; right: 20px; background: #0f172a; color: white; padding: 12px 25px; border-radius: 8px; z-index: 100; box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
</style>