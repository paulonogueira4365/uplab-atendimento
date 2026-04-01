<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  interface Usuario {
    id: string;
    nome: string;
    nivel: string;
    permissoes: {
      atendimento: boolean;
      gerencia: boolean;
      lider: boolean;
      adm: boolean;
    };
  }

  let usuarios: Usuario[] = [];
  let carregando = false;
  let mensagem = '';

  onMount(buscarUsuarios);

  async function buscarUsuarios() {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome, nivel, permissoes')
      .order('nome', { ascending: true });
    
    if (data) {
      // Garante que o objeto de permissões exista para não quebrar o switch
      usuarios = data.map(u => ({
        ...u,
        permissoes: u.permissoes || { atendimento: true, gerencia: false, lider: false, adm: false }
      }));
    }
  }

  async function salvarPermissoes(usuario: Usuario) {
    carregando = true;
    const { error } = await supabase
      .from('usuarios')
      .update({ permissoes: usuario.permissoes })
      .eq('id', usuario.id);

    if (!error) {
      mensagem = `✅ Permissões de ${usuario.nome} atualizadas!`;
      setTimeout(() => (mensagem = ''), 3000);
    } else {
      mensagem = "❌ Erro ao salvar: " + error.message;
    }
    carregando = false;
  }

  function togglePermissao(index: number, chave: keyof Usuario['permissoes']) {
    usuarios[index].permissoes[chave] = !usuarios[index].permissoes[chave];
    // Força a re-renderização do Svelte
    usuarios = [...usuarios];
  }
</script>

<div class="perm-container">
  <header>
    <h1>Controle de Acessos</h1>
    <p>Defina quais módulos cada colaborador da UPLAB pode visualizar e operar.</p>
  </header>

  {#if mensagem}
    <div class="toast">{mensagem}</div>
  {/if}

  <div class="table-card">
    <table>
      <thead>
        <tr>
          <th>Colaborador</th>
          <th>Nível Base</th>
          <th class="center">Atendimento</th>
          <th class="center">Gerência</th>
          <th class="center">Líder</th>
          <th class="center">ADM</th>
          <th class="right">Ação</th>
        </tr>
      </thead>
      <tbody>
        {#each usuarios as user, i}
          <tr>
            <td>
              <span class="user-name">{user.nome}</span>
            </td>
            <td>
              <span class="nivel-tag">{user.nivel}</span>
            </td>
            
            <td class="center">
              <input type="checkbox" checked={user.permissoes.atendimento} on:change={() => togglePermissao(i, 'atendimento')} />
            </td>
            <td class="center">
              <input type="checkbox" checked={user.permissoes.gerencia} on:change={() => togglePermissao(i, 'gerencia')} />
            </td>
            <td class="center">
              <input type="checkbox" checked={user.permissoes.lider} on:change={() => togglePermissao(i, 'lider')} />
            </td>
            <td class="center">
              <input type="checkbox" checked={user.permissoes.adm} on:change={() => togglePermissao(i, 'adm')} />
            </td>

            <td class="right">
              <button class="btn-save" on:click={() => salvarPermissoes(user)} disabled={carregando}>
                Salvar
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .perm-container { max-width: 1000px; margin: 40px auto; padding: 0 20px; }
  header { margin-bottom: 30px; }
  h1 { font-size: 1.8rem; color: #0f172a; margin: 0; }
  p { color: #64748b; font-size: 0.9rem; margin-top: 5px; }

  .table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  
  table { width: 100%; border-collapse: collapse; }
  th { background: #f8fafc; padding: 15px; text-align: left; font-size: 0.75rem; color: #475569; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
  td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #1e293b; }

  .center { text-align: center; }
  .right { text-align: right; }

  .user-name { font-weight: 700; color: #0f172a; }
  .nivel-tag { font-size: 0.7rem; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; color: #475569; font-weight: 600; text-transform: uppercase; }

  /* Estilização básica do Checkbox (pode ser melhorado com CSS de Switch) */
  input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: #2563eb; }

  .btn-save { background: #0f172a; color: white; border: none; padding: 6px 15px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
  .btn-save:hover { background: #2563eb; }
  .btn-save:disabled { opacity: 0.5; }

  .toast { position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 12px 25px; border-radius: 8px; box-shadow: 0 10px 15px rgba(0,0,0,0.1); font-weight: 600; animation: slideUp 0.3s ease-out; }

  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>