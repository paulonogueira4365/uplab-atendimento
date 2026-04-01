<script lang="ts">
  import { supabase } from '$lib/supabase';
  
  let nome = '', senha = '', nivel = 'atendente';
  let carteirasSelecionadas: string[] = []; 
  let mensagem = '';
  let carregando = false;

  // Lista COMPLETA conforme sua estrutura de transbordo
  const opcoesCarteiras = [
    "BERÇÁRIO", 
    "CLIENTES ANA", 
    "LABORATÓRIOS", 
    "QUALIDADE", 
    "INOVAÇÃO", 
    "EXCELÊNCIA"
  ];

  async function cadastrar() {
    if (!nome || !senha) {
      mensagem = "⚠️ Preencha nome e senha.";
      return;
    }

    carregando = true;
    
    // Define a string de carteiras apenas para atendentes
    const carteiraFinal = (nivel === 'atendente') 
      ? carteirasSelecionadas.join(', ') 
      : '';

    const { error } = await supabase
      .from('usuarios')
      .insert([{ 
        nome, 
        senha, 
        carteira: carteiraFinal, 
        nivel,
        status: 'offline',
        // O campo 'ultima_atividade' será preenchido pelo DEFAULT NOW() do seu banco
        permissoes: {
          atendimento: true,
          gerencia: nivel !== 'atendente',
          lider: nivel !== 'atendente',
          adm: nivel === 'diretoria'
        }
      }]);

    if (error) {
      mensagem = "❌ Erro ao salvar: " + error.message;
    } else {
      mensagem = "✅ " + nome + " cadastrado com sucesso!";
      // Reset de campos para o próximo cadastro
      nome = ''; 
      senha = ''; 
      carteirasSelecionadas = [];
      nivel = 'atendente';
    }
    carregando = false;
  }

  function toggleCarteira(ct: string) {
    if (carteirasSelecionadas.includes(ct)) {
      carteirasSelecionadas = carteirasSelecionadas.filter(i => i !== ct);
    } else {
      carteirasSelecionadas = [...carteirasSelecionadas, ct];
    }
  }
</script>

<div class="admin-container">
  <div class="card">
    <div class="header">
      <div class="logo">UP<span>LAB</span></div>
      <h1>Cadastro de Usuários</h1>
      <p class="subtitle">Matriz Curitiba</p>
    </div>
    
    {#if mensagem}
      <div class="alert" class:error={mensagem.includes('Erro')}>
        {mensagem}
      </div>
    {/if}

    <div class="form">
      <div class="group">
        <label>Nome do Usuário (Login)</label>
        <input type="text" bind:value={nome} placeholder="Ex: Bruna Arruada" />
      </div>

      <div class="group">
        <label>Senha (6 dígitos)</label>
        <input type="password" maxlength="6" bind:value={senha} placeholder="******" />
      </div>

      <div class="group">
        <label>Nível de Acesso</label>
        <select bind:value={nivel}>
          <option value="atendente">Atendente (Operação)</option>
          <option value="supervisor">Supervisor / Líder</option>
          <option value="diretoria">Diretoria (ADM)</option>
        </select>
      </div>

      {#if nivel === 'atendente'}
        <div class="group">
          <label>Vincular Carteiras (Triagem Automática)</label>
          <div class="checkbox-grid">
            {#each opcoesCarteiras as ct}
              <button 
                type="button"
                class="chip" 
                class:active={carteirasSelecionadas.includes(ct)}
                on:click={() => toggleCarteira(ct)}
              >
                <span class="ct-name">{ct}</span>
                {#if ["BERÇÁRIO", "CLIENTES ANA", "LABORATÓRIOS"].includes(ct)}
                  <span class="dest">→ Transfere p/ Bruna</span>
                {:else if ct === "QUALIDADE"}
                  <span class="dest">→ Transfere p/ Emanuelle</span>
                {:else if ct === "INOVAÇÃO"}
                  <span class="dest">→ Transfere p/ Depto Inovação</span>
                {:else if ct === "EXCELÊNCIA"}
                  <span class="dest">→ Transfere p/ Depto Excelência</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {:else}
        <div class="info-box">
          <p><strong>Aviso:</strong> Níveis de gestão possuem acesso global aos dados e não são vinculados a carteiras específicas de triagem.</p>
        </div>
      {/if}

      <button class="btn-save" on:click={cadastrar} disabled={carregando}>
        {carregando ? 'SALVANDO...' : 'CADASTRAR NA MATRIZ'}
      </button>
    </div>
  </div>
</div>

<style>
  .admin-container { min-height: 100vh; background: #f1f5f9; display: flex; justify-content: center; align-items: center; padding: 20px; font-family: 'Inter', sans-serif; }
  .card { background: white; width: 100%; max-width: 580px; padding: 40px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); }
  
  .header { text-align: center; margin-bottom: 30px; }
  .logo { font-size: 2.5rem; font-weight: 900; color: #0f172a; }
  .logo span { color: #2563eb; }
  .subtitle { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px; }
  
  .group { margin-bottom: 25px; }
  label { display: block; font-size: 0.75rem; font-weight: 800; color: #475569; margin-bottom: 8px; text-transform: uppercase; }
  
  input, select { width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; box-sizing: border-box; }
  input:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }

  .checkbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .chip {
    padding: 12px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 14px;
    font-size: 0.75rem; font-weight: 700; color: #475569; cursor: pointer; text-align: left;
    display: flex; flex-direction: column; transition: all 0.2s;
  }
  .chip:hover { border-color: #cbd5e1; background: #f1f5f9; }
  .chip.active { background: #eff6ff; border-color: #2563eb; color: #1e40af; }
  
  .ct-name { font-weight: 800; }
  .dest { font-size: 0.6rem; color: #94a3b8; font-weight: 500; margin-top: 4px; }
  .active .dest { color: #60a5fa; }

  .info-box { background: #f0f9ff; padding: 15px; border-radius: 12px; border-left: 4px solid #0ea5e9; font-size: 0.85rem; color: #0369a1; }

  .btn-save { width: 100%; padding: 18px; background: #0f172a; color: white; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 1rem; margin-top: 10px; }
  .btn-save:hover { background: #1e293b; transform: translateY(-2px); }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

  .alert { padding: 15px; border-radius: 12px; text-align: center; margin-bottom: 25px; font-weight: 700; border: 1px solid #bae6fd; background: #f0f9ff; color: #0369a1; }
  .alert.error { background: #fef2f2; color: #991b1b; border-color: #fee2e2; }
</style>