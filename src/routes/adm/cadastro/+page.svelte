<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  
  let nome = '', senha = '', nivel = 'atendente';
  let carteirasSelecionadas: string[] = []; 
  let opcoesBanco: string[] = [];
  let mensagem = '';
  let carregando = false;

  onMount(async () => {
    // Puxa as carteiras reais da sua base de clientes
    const { data } = await supabase.from('clientes').select('carteira');
    if (data) {
      opcoesBanco = [...new Set(data.map(c => c.carteira).filter(Boolean))].sort();
    }
  });

  async function cadastrarUsuario() {
    if (!nome || !senha) return mensagem = "⚠️ Preencha os campos.";
    carregando = true;

    const { error } = await supabase.from('usuarios').insert([{ 
      nome, 
      senha, 
      nivel,
      status: 'offline', // Começa offline por padrão
      carteira: nivel === 'atendente' ? carteirasSelecionadas.join(', ') : '',
      permissoes: { atendimento: true, adm: nivel === 'diretoria' }
    }]);

    if (error) {
      mensagem = "❌ Erro: " + error.message;
    } else {
      mensagem = "✅ Usuário indexado à rede de atendimento!";
      nome = ''; senha = ''; carteirasSelecionadas = [];
    }
    carregando = false;
  }
</script>

<div class="page">
  <div class="card">
    <h3>Vincular Atendente à Carteira</h3>
    
    <input type="text" bind:value={nome} placeholder="Nome do Atendente" />
    <input type="password" bind:value={senha} placeholder="Senha" />

    <label>Selecione as Carteiras SGO:</label>
    <div class="grid">
      {#each opcoesBanco as ct}
        <button 
          class="chip" 
          class:active={carteirasSelecionadas.includes(ct)}
          on:click={() => {
            carteirasSelecionadas = carteirasSelecionadas.includes(ct) 
              ? carteirasSelecionadas.filter(i => i !== ct) 
              : [...carteirasSelecionadas, ct];
          }}
        >
          {ct}
        </button>
      {/each}
    </div>

    <button class="save" on:click={cadastrarUsuario} disabled={carregando}>
      {carregando ? 'SALVANDO...' : 'CADASTRAR E SINCRONIZAR'}
    </button>

    {#if mensagem} <p class="msg">{mensagem}</p> {/if}
  </div>
</div>

<style>
  .page { padding: 20px; font-family: sans-serif; display: flex; justify-content: center; }
  .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 400px; }
  input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin: 10px 0; }
  .chip { padding: 8px; border: 1px solid #eee; border-radius: 5px; cursor: pointer; font-size: 0.7rem; font-weight: bold; }
  .chip.active { background: #2563eb; color: white; border-color: #2563eb; }
  .save { width: 100%; padding: 12px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 15px; }
  .msg { text-align: center; font-size: 0.8rem; font-weight: bold; margin-top: 15px; color: #2563eb; }
</style>