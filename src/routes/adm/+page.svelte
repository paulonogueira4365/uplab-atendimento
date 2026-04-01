<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  interface Usuario {
    id: string;
    nome: string;
    carteira: string;
    nivel: string;
    status: string;
    permissoes: any;
  }

  let usuarios: Usuario[] = [];
  let busca = '';
  let carregando = true;

  onMount(buscarDados);

  async function buscarDados() {
    carregando = true;
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });

    if (data) usuarios = data;
    carregando = false;
  }

  // Filtro inteligente reativo
  $: filtrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(busca.toLowerCase()) || 
    u.carteira.toLowerCase().includes(busca.toLowerCase())
  );

  // Estatísticas Rápidas
  $: total = usuarios.length;
  $: online = usuarios.filter(u => u.status === 'online' || u.status === 'disponível').length;
  $: adms = usuarios.filter(u => u.permissoes?.adm).length;
</script>

<div class="adm-wrapper">
  <header class="main-header">
    <div class="brand">
      <h1>Gestão de Acessos Matriz</h1>
      <p>Controle centralizado de usuários e permissões UPLAB</p>
    </div>
    <div class="nav-links">
      <a href="/adm/cadastro" class="btn-nav">+ Novo Usuário</a>
      <a href="/adm/permissoes" class="btn-nav secondary">🛡️ Ajustar Permissões</a>
      <a href="/adm/edicao" class="btn-nav secondary">📝 Editar Dados</a>
    </div>
  </header>

  <div class="stats-bar">
    <div class="stat-item">
      <span class="label">Total Colaboradores</span>
      <span class="value">{total}</span>
    </div>
    <div class="stat-item">
      <span class="label">Operação Online</span>
      <span class="value color-green">{online}</span>
    </div>
    <div class="stat-item">
      <span class="label">Administradores</span>
      <span class="value color-blue">{adms}</span>
    </div>
  </div>

  <section class="table-section">
    <div class="table-controls">
      <h2>Listagem de Cadastros</h2>
      <input 
        type="text" 
        placeholder="🔍 Buscar por nome ou carteira (ex: Berçário)..." 
        bind:value={busca} 
      />
    </div>

    <div class="table-container">
      {#if carregando}
        <div class="msg">Carregando base de dados...</div>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Carteira Principal</th>
              <th>Nível Base</th>
              <th>Módulos Ativos</th>
              <th>Status Atual</th>
            </tr>
          </thead>
          <tbody>
            {#each filtrados as user}
              <tr>
                <td class="name-cell">{user.nome}</td>
                <td><span class="tag-carteira">{user.carteira}</span></td>
                <td><span class="nivel-text">{user.nivel}</span></td>
                <td>
                  <div class="perms-icons">
                    {#if user.permissoes?.atendimento}<span title="Atendimento">🎧</span>{/if}
                    {#if user.permissoes?.gerencia}<span title="Gerência">📊</span>{/if}
                    {#if user.permissoes?.lider}<span title="Líder">👥</span>{/if}
                    {#if user.permissoes?.adm}<span title="Admin">🛡️</span>{/if}
                  </div>
                </td>
                <td>
                  <span class="status-badge {user.status}">
                    {user.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </section>
</div>

<style>
  :global(body) { background: #f4f7fa; }
  .adm-wrapper { max-width: 1200px; margin: 30px auto; padding: 0 20px; }

  .main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
  .brand h1 { font-size: 1.8rem; color: #0f172a; margin: 0; font-weight: 800; }
  .brand p { color: #64748b; font-size: 0.9rem; }

  .nav-links { display: flex; gap: 10px; }
  .btn-nav { padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.85rem; transition: 0.2s; background: #2563eb; color: white; }
  .btn-nav.secondary { background: white; color: #1e293b; border: 1px solid #e2e8f0; }
  .btn-nav:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

  .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
  .stat-item { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
  .stat-item .label { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
  .stat-item .value { font-size: 2rem; font-weight: 900; color: #1e293b; }
  .color-green { color: #10b981 !important; }
  .color-blue { color: #2563eb !important; }

  .table-section { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .table-controls { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
  .table-controls h2 { font-size: 1.1rem; margin: 0; color: #1e293b; }
  .table-controls input { padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 8px; width: 300px; outline: none; }
  .table-controls input:focus { border-color: #2563eb; }

  table { width: 100%; border-collapse: collapse; }
  th { background: #f8fafc; text-align: left; padding: 15px; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
  td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }

  .name-cell { font-weight: 700; color: #0f172a; }
  .tag-carteira { background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
  .nivel-text { font-size: 0.8rem; color: #64748b; text-transform: capitalize; }
  
  .perms-icons { display: flex; gap: 8px; font-size: 1.1rem; }
  
  .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
  .status-badge.online, .status-badge.disponível { background: #dcfce7; color: #15803d; }
  .status-badge.bloqueado { background: #fee2e2; color: #b91c1c; }
  .status-badge.offline { background: #f1f5f9; color: #475569; }

  .msg { padding: 40px; text-align: center; color: #94a3b8; }
</style>