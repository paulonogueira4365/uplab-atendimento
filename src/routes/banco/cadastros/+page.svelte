<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let processando = false;
  let mensagem = '';
  let totalClientes = 0;
  let fileInput: HTMLInputElement;

  onMount(() => atualizarContador());

  async function atualizarContador() {
    const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
    totalClientes = count || 0;
  }

  function limparTexto(texto: string) {
    if (!texto || texto.trim() === "") return null; // Retorna NULL para o banco se estiver vazio
    
    let f = texto.trim().toUpperCase();

    if (f.includes("EXCEL") || f.includes("EXC")) return "EXCELENCIA";
    if (f.includes("INOVA")) return "INOVACAO";
    if (f.includes("BERCA")) return "BERCARIO";
    if (f.includes("LABORAT")) return "LABORATORIOS";
    if (f.includes("QUALID")) return "QUALIDADE";
    if (f.includes("ANA")) return "CLIENTES ANA";
    if (f === "GERAL" || f === "VAZIO") return null;

    return f.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  }

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    processando = true;
    mensagem = "⏳ Processando arquivo...";

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      await processarDados(text);
    };
    reader.readAsText(file, 'ISO-8859-1'); 
  }

  async function processarDados(csvText: string) {
    const linhas = csvText.split(/\r?\n/).filter(l => l.trim().length > 3);
    const dicionarioClientes: Record<number, any> = {};
    
    // Removemos o cabeçalho se ele existir (SGO;NOME...)
    if (linhas[0].toUpperCase().includes("SGO")) {
      linhas.shift();
    }

    linhas.forEach((linha) => {
      // Tenta split por ; depois por ,
      let colunas = linha.split(';');
      if (colunas.length < 2) colunas = linha.split(',');
      
      const sgoNum = parseInt(colunas[0]?.replace(/\D/g, '') || '');

      if (isNaN(sgoNum)) return;

      const nome = colunas[1]?.trim().toUpperCase() || 'CLIENTE SEM NOME';
      const tel = colunas[2]?.trim() || '';
      const carteiraRaw = colunas[3] || '';
      const carteiraLimpa = limparTexto(carteiraRaw);

      if (dicionarioClientes[sgoNum]) {
        // Unifica carteiras se houver duplicata de SGO no arquivo
        if (carteiraLimpa) {
          const existentes = dicionarioClientes[sgoNum].carteira ? dicionarioClientes[sgoNum].carteira.split(', ') : [];
          if (!existentes.includes(carteiraLimpa)) {
            dicionarioClientes[sgoNum].carteira = existentes.length > 0 
              ? `${dicionarioClientes[sgoNum].carteira}, ${carteiraLimpa}` 
              : carteiraLimpa;
          }
        }
      } else {
        dicionarioClientes[sgoNum] = {
          sgo: sgoNum,
          nome_fantasia: nome,
          telefone: tel,
          carteira: carteiraLimpa // Agora pode ser null
        };
      }
    });

    const clientesParaSubir = Object.values(dicionarioClientes);
    const totalFinal = clientesParaSubir.length;

    if (totalFinal === 0) {
      mensagem = "❌ Erro: Nenhum cliente válido encontrado.";
      processando = false;
      return;
    }

    mensagem = `🚀 Subindo ${totalFinal} clientes (com e sem carteira)...`;

    const tamanhoLote = 500;
    for (let i = 0; i < totalFinal; i += tamanhoLote) {
      const lote = clientesParaSubir.slice(i, i + tamanhoLote);
      const { error } = await supabase.from('clientes').upsert(lote, { onConflict: 'sgo' });
      if (error) console.error("Erro no lote:", error);
    }

    mensagem = `✅ SUCESSO! ${totalFinal} clientes atualizados na Matriz.`;
    if (fileInput) fileInput.value = '';
    atualizarContador();
    processando = false;
  }
</script>

<div class="admin-page">
  <div class="container">
    <div class="header">
      <div class="title-group">
        <h1>🗄️ Indexador UPLAB</h1>
        <p>Centralização Matriz Curitiba</p>
      </div>
      <div class="stats">
        <span class="label">BASE TOTAL</span>
        <span class="value">{totalClientes}</span>
      </div>
    </div>

    <div class="card">
      <div class="upload-area" class:loading={processando}>
        <div class="icon">📁</div>
        <h2>Importar CSV</h2>
        <p>Clientes sem carteira no arquivo serão mantidos como "Indisponíveis".</p>
        
        <input 
          type="file" 
          accept=".csv" 
          bind:this={fileInput}
          on:change={handleFileUpload} 
          disabled={processando}
          id="file-upload"
        />
        
        <label for="file-upload" class="btn-upload">
          {processando ? 'PROCESSANDO...' : 'SELECIONAR ARQUIVO'}
        </label>
      </div>

      {#if mensagem}
        <div class="status-alert" class:error={mensagem.includes('❌')}>
          {mensagem}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .admin-page { min-height: 100vh; background: #f8fafc; padding: 40px 20px; font-family: 'Inter', sans-serif; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
  .title-group h1 { margin: 0; color: #0f172a; font-size: 1.8rem; font-weight: 800; }
  .stats { background: #0f172a; color: white; padding: 15px 25px; border-radius: 15px; text-align: center; }
  .stats .value { font-size: 1.5rem; font-weight: 700; color: #3b82f6; display: block; }
  .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .upload-area { border: 2px dashed #e2e8f0; border-radius: 15px; padding: 40px 20px; text-align: center; background: #fbfcfd; }
  .btn-upload { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; margin-top: 20px; }
  .status-alert { margin-top: 20px; padding: 15px; border-radius: 10px; text-align: center; background: #f0f9ff; color: #0369a1; font-weight: 600; }
  .status-alert.error { background: #fef2f2; color: #991b1b; }
  input[type="file"] { display: none; }
</style>