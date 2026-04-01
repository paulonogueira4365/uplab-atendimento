<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let nome = '';
  let senha = '';
  let carregando = false;
  let erroMsg = '';

  async function handleLogin() {
    console.log("Iniciando login para:", nome);
    carregando = true;
    erroMsg = '';

    try {
      // 1. Busca o usuário (usando .select() sem .single() para evitar travas de erro 406)
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('nome', nome.trim())
        .eq('senha', senha.trim());

      if (error) {
        console.error("Erro Supabase:", error.message);
        erroMsg = "Erro na conexão: " + error.message;
        return;
      }

      if (!data || data.length === 0) {
        console.warn("Usuário não encontrado");
        erroMsg = "Usuário ou senha incorretos!";
        return;
      }

      const user = data[0];
      console.log("Usuário validado:", user.nome);

      // 2. Monta a sessão com fallback para permissões
      const userSession = {
        id: user.id,
        nome: user.nome,
        nivel: user.nivel,
        carteira: user.carteira,
        permissoes: user.permissoes || { atendimento: true, gerencia: false, lider: false, adm: false }
      };

      // 3. Salva no localStorage (o Layout vai ler isso)
      localStorage.setItem('user_session', JSON.stringify(userSession));
      console.log("Sessão salva no localStorage");

      // 4. Atualiza atividade no banco
      await supabase
        .from('usuarios')
        .update({ status: 'online', ultima_atividade: new Date().toISOString() })
        .eq('id', user.id);

      // 5. Redirecionamento forçado
      alert("Sucesso! Entrando no sistema...");
      
      if (userSession.permissoes.adm || user.nivel === 'diretoria') {
        window.location.href = "/adm"; 
      } else {
        window.location.href = "/atendimento/status";
      }

    } catch (e) {
      console.error("Erro fatal no script:", e);
      erroMsg = "Erro interno no sistema.";
    } finally {
      carregando = false;
    }
  }

  // Se já estiver logado, pula o login
  onMount(() => {
    if (localStorage.getItem('user_session')) {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      if (session.nome) window.location.href = "/atendimento/status";
    }
  });
</script>

<div class="login-wrapper">
  <div class="login-card">
    <div class="header">
      <div class="logo">UP<span>LAB</span></div>
      <h1>Acesso Interno</h1>
    </div>

    <form on:submit|preventDefault={handleLogin}>
      <div class="field">
        <label>Usuário</label>
        <input type="text" bind:value={nome} placeholder="Ex: DIRETORIA" required />
      </div>

      <div class="field">
        <label>Senha de 6 dígitos</label>
        <input type="password" maxlength="6" bind:value={senha} placeholder="••••••" required />
      </div>

      {#if erroMsg}
        <div class="error">{erroMsg}</div>
      {/if}

      <button type="submit" disabled={carregando}>
        {carregando ? 'CARREGANDO...' : 'ENTRAR'}
      </button>
    </form>
  </div>
</div>

<style>
  .login-wrapper { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }
  .login-card { background: white; padding: 40px; border-radius: 12px; width: 100%; max-width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
  .logo { font-size: 2rem; font-weight: 900; text-align: center; color: #0f172a; }
  .logo span { color: #2563eb; }
  h1 { font-size: 1rem; text-align: center; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
  .field { margin-top: 20px; }
  label { display: block; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 5px; }
  input { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; box-sizing: border-box; font-size: 1rem; }
  input:focus { outline: none; border-color: #2563eb; }
  button { width: 100%; margin-top: 25px; padding: 15px; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
  button:disabled { background: #94a3b8; }
  .error { background: #fef2f2; color: #b91c1c; padding: 10px; border-radius: 6px; margin-top: 15px; font-size: 0.85rem; text-align: center; }
</style>