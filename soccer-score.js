/**
/**
 * Cria �rea de placar de futebol no Bate-papo
 **/
BPModulo_Placarfutebolv2 = {

	/**
	 * M�dulo esta ativo?
	 */
	is_active : _is_active,

	/**
	 * ID dos markups que ser�o criados e as colunas
	 * onde eles ser�o criados
	 **/
	markup : {
		"grade": { // grade para poder usar position:absolute dentro da coluna da direita
			"parent" : "col-esquerda",
			"id" : "grade-col-esquerda"
		},

		"combo_campe": {
			"parent": "grade-col-esquerda",
			"id" : "combo_campeonato"
		},
		
		"combo": {
			"parent": "grade-col-esquerda",
			"id" : "combo_jogos"
		},		
		
		"titulo": {
			"parent": "grade-col-esquerda",
			"id" : "placar_resultado"
		},

		"lances": {
			"parent": "grade-col-esquerda",
			"id" : "placar_lances"
		},

		"cronjogo": {
			"parent" : "grade-col-esquerda",
			"id" : "cron-update-jogo"
		}
	},

	/**
	 * URL onde est�o os arquivos de configura��o
	 **/
	base_url : BP.base_config,

	/**
	 * Sufixo que deve ser adicionado ao nome do arquivo
	 * do jogo acompanhado.
	 **/
	sufixo_arquivo : "-batepapo.js",

	/**
	 * Arquivo do jogo em andamento
	 **/
	jogo_atual : null,

	/**
	 * Tempo atual do jogo
	 */
	tempo_atual : 1,

	/**
	 * Arquivo com a lista de jogos em andamento/pr�ximos jogos
	 **/
	base_jogos_url : "http://placar.esporte.uol.com.br/futebol/**/batepapo-lista_jogos.js",
	arquivo_outros_jogos : "http://placar.esporte.uol.com.br/futebol/**/batepapo-lista_jogos.js",
	
	/**
	 * JSON (object) com as informa��es do jogo que esta sendo
	 * acompanhado
	 **/
	jogo_info : {},

	/**
	 * Array de {objects} com o nome, placar e path do arquivo json
	 * dos jogos que podem ser acompanhados no dia, para o campeonato atual
	 **/
	indice_jogos_atual : [],
	
	/**
		campeonatos ser� preenchida pela f() fillCampeCombo;
	**/
	campeonatos : [],
	/**
		campeonatos_total_set: hash table para encontrar o nome bonito do campeonato de forma eficiente
	**/
	campeonatos_total_set : {
						"paulista":"Paulista", 
						"brasileirao":"Brasileir�o", 
						"amistosos":"Amistosos",
						"mundial-de-clubes-da-fifa":"Mundial de clubes da FIFA", 
						"serie-b":"S�rie B",
						"copa-sul-americana":"Sul-americana",
						"alemao":"Alem�o",
						"frances":"Franc�s",
						"mundial-sub-20":"Mundial Sub-20",
						"argentino":"Argentino - Apertura",
						"recopa-sul-americana":"Recopa Sul Americana",
						"portugues":"Portugu�s",
						"ingles":"Ingl�s",
						"supercopa-da-espanha":"Supercopa da Espanha",
						"espanhol":"Espanhol",
						"italiano":"Italiano",
						"liga-dos-campeoes":"Liga dos Campe�es",
						"eliminatorias-da-eurocopa":"Elim. da Eurocopa",
						"eliminatorias-sul-americanas":"Elim. Sul-americanas",
						"copa-sao-paulo":"Copa S�o Paulo",
						"copa-do-brasil":"Copa do Brasil",
						"libertadores":"Libertadores",
						"carioca":"Estadual do Rio",
						"gaucho":"Ga�cho",
						"outros":"Outros estaduais",
						"liga-europa":"Liga da Europa",
						"mineiro":"Mineiro"},

	campeonato_atual :  _campeonato, /* a var _campeonato � global; ela vem do ativo.js, que determina (com aux�lio do publicador) se o m�dulo .this est� ativo e qual o campeonato default escolhido */
	
	campeonatos_combo: _campeonatos_ativos,
	
	fillCampeCombo : function(){		
		var cl = this.campeonatos_combo;
		/***
			- A var this.campeonatos_combo � carregada com os campeonatos selecionados pelo editor.
			- campeonatos_total_set foi colocada como auxiliar para preencher os campeonatos que devem
			popular o combo.
			- campeonatos_total_set funciona como uma hash table para descobrir o nome "bonito" do campeonato.
			  o intuito � o de poder usar um algoritmo de O(n) em cl;			
		***/
		for(var i in cl) {
			getCampeFromTotalSet = this.campeonatos_total_set[cl[i]];
			if(getCampeFromTotalSet) {
				this.campeonatos.push( {nome:[cl[i], getCampeFromTotalSet ]} )  ;
			}
		}
	},
	/**
	 * Inicia a sala com placar de futebol
	 **/
	init : function() {
		console.log('v2.11');
		this.markup.grade["obj"].className    = "";
		this.markup.cronjogo["obj"].className = "";

		// Carrega a lista de jogos
		this.loadJogos();

		this.fillCampeCombo();
		// Cria um cronometro para carregar o placar de outros
		// jogos que est�o ocorrendo no momento
		if(!Cron.exist("update-jogos")) {
			Cron.start({
				callback: function() { BPModulo_Placarfutebolv2.loadJogos(); },
				time: 300,
				markup: null
			}, "update-jogos", false);
		}

		if(!Cron.exist("update-jogo")) {
			Cron.start({
				callback: function() { BPModulo_Placarfutebolv2.loadJogoAtual(); },
				time: 20,
				markup: "cron-update-jogo"
			}, "update-jogo", false);
		}

		Cron.play("update-jogo");
		Cron.play("update-jogos");
		document.getElementById("placar_resultado").visibility = "hidden";
		
		if(!this.is_active) {			
			this.is_active = !this.is_active;
			this.removeModulo(document.getElementById('opcaoModulo'));
		}
	},

	/**
	 * Remove o m�dulo (esconde a coluna da esquerda)
	 * e pausa os 'cron�metros'
	 */
	removeModulo : function(botao) {
		this.is_active = !this.is_active;
		
		if(!this.is_active) {
			botao.firstChild.src = botao.firstChild.src.replace("sem-", "com-");

			document.body.className = "semmodulo";
			Cron.stop("update-jogo");
			Cron.stop("update-jogos");
		}
		else {
			botao.firstChild.src = botao.firstChild.src.replace("com-", "sem-");

			document.body.className = "now";
			this.init();
		}
	},

	/**
	 * Retorna o caminho correto do JS com as informa��es
	 * do jogo.
	 *
	 * A url de entrada � a que o Publicador exporta.
	 **/
	URLJson : function(placar) {
		return placar.replace("?id=/", "").replace(".js", "") + this.sufixo_arquivo;
		//return placar.replace("http://placar.copadomundo.uol.com.br/2010/jogos/", "http://tc.batepapo.uol.com.br/bp-modular-beta/modulos/placarfutebol/").replace("?id=/", "").replace(".js", "") + this.sufixo_arquivo;
	},

	/**
	 * Atrav�s da URL, retorna o id do jogo
	 *
	 * @param String URL do Placar (do UOL Esporte)
	 * @return String Path do JS do jogo
	 **/
	IDJogo : function(url) {
		if(url.indexOf("?id=") == -1) return null;

		return url.split("?id=")[1];
	},


	ordenaJogos : function(a,b) {
		//if(a.status.toLowerCase() != "em andamento") {
		//	return -1;
		//}
		
		//if(b.status.toLowerCase() != "em andamento") {
		//	return 1;
		//}

		var dataJogoA = (a.data + " " + a.horario).match(/(\d+)\/(\d+)\/(\d+) (\d+)\h(\d+)/);
		var dataJogoB = (b.data + " " + b.horario).match(/(\d+)\/(\d+)\/(\d+) (\d+)\h(\d+)/);

		var dataJogoA_date = new Date(dataJogoA[3], dataJogoA[2], dataJogoA[1], dataJogoA[4], dataJogoA[5], 0, 0);
		var dataJogoB_date = new Date(dataJogoB[3], dataJogoB[2], dataJogoB[1], dataJogoB[4], dataJogoB[5], 0, 0);

		return dataJogoA_date >= dataJogoB_date ? -1 : 1;
	},


	/**
	 * Carrega a lista de jogos que podem ser acompanhados
	 **/
	loadJogos : function() {
	
		function split_insert(string, insertee) {
			str_array = string.split("**");
			if(str_array[1]) {
				return str_array[0] + insertee + str_array[1];
			}
			return undefined;			
		};
		
			this.arquivo_outros_jogos = split_insert(this.base_jogos_url, this.campeonato_atual) || this.arquivo_outros_jogos;
		
		var obj = this;
		
		
		//for (var i = 0; i < this.campeonatos.length; i++) {
			
			//obj.campeonatos[i].link = split_insert(this.base_jogos_url, this.campeonatos[i].nome) || this.campeonatos[i].link;
						
			//********* c�digo abaixo cf. http://www.mennovanslooten.nl/blog/post/62 ********//
			/*
			(function(objc, iter){
			
					loadScript(objc.campeonatos[iter].link, function(){
						if(typeof OutrosJogos == "object" && OutrosJogos instanceof Array) {	
							var o = OutrosJogos;
							if(o) {					
								alert(o[0].link);
								objc.campeonatos[iter].link = o[0].link;														
							}							
							OutrosJogos = [];
						}
						});
			})(obj, i);
									
		}		*/
		
		loadScript(this.arquivo_outros_jogos, function() {
			if(typeof OutrosJogos == "object" && OutrosJogos instanceof Array) {

				// Ordena os jogos em ordem de data
				OutrosJogos.sort(obj.ordenaJogos);				
				
				
				// descobre qual o jogo que deve ser carregado pela primeira vez,
				// caso isso j� n�o tenha sido feito
				
				if(!obj.jogo_atual) {
					for(j in OutrosJogos) {
						var jogo = OutrosJogos[j];
						if(jogo.principal && jogo.ativo) {
							obj.jogo_atual = jogo.link;
							break;
						}
					}

					// se n�o existe nenhum jogo com status 'principal'
					// pega o primeiro que est� no array ordenado
					if(!obj.jogo_atual) {
						obj.jogo_atual = OutrosJogos[0].link;
					}
				}

				obj.mountCombo(obj.campeonatos, OutrosJogos);				
				
				// Monta o placar
				obj.loadJogoAtual();

				// limpa o array
				OutrosJogos = [];
			}
		});
	},

	/**
	 * Carrega as informa��es do jogo atual
	 **/
	loadJogoAtual : function() {
		if(!this.jogo_atual) return;

		// Para o contador de atualiza��o
		Cron.stop("update-jogo");
		this.markup.cronjogo["obj"].innerHTML = "Aguarde, carregando...";

		// Carrega as informa��es do jogo
		loadScript(this.URLJson(this.jogo_atual), function() {
			BPModulo_Placarfutebolv2.jogo_info = cloneObject(Jogo);

			if(Jogo.Info) delete Jogo.Info;
			if(Jogo.Lances) delete Jogo.Lances;
			if(Jogo.Penaltis) delete Jogo.Penaltis;
			if(Jogo.Status) delete Jogo.Status;
			if(Jogo.Times) delete Jogo.Times;

			BPModulo_Placarfutebolv2.mount();			
			
			// Renicia o contador
			Cron.play("update-jogo");
		});
	},

	/**
	 * Monta o combo com os jogos dispon�veis para acompanhamento
	 *
	 * @param Array Informa��es dos jogos
	 **/
	mountCombo : function(campeonatos, jogos) {
	
		if(jogos.length == 0) {
			this.markup.combo["obj"].className = "hidden";
			this.markup.combo["obj"].innerHTML = "";
			return false;
		}

		this.markup.combo["obj"].className = "";
		this.markup.combo_campe["obj"].className = "";
		
		

		// n�mero de jogos encerrados (para defini��o de estilo)
		var num_jogos_encerrados = 0;
		var num_jogos_andamento  = 0;
		var num_jogos_proximos   = 0;

		//var lista = '<strong>Escolha o jogo: </strong><div class="comboJogos"><span onclick="BPCombo.toggle(\'comboULJogos\')">Jogos em andamento</span><ul id="comboULJogos" class="hidden" callback="BPModulo_Placarfutebolv2.change(this.value)">';
		var lista = '<strong>Escolha o jogo: </strong><select id="slct_jogo" onchange="javascript:BPModulo_Placarfutebolv2.change(this.value);">'
		var camp_list = '<strong>Campeonato: </strong><select id="slct_champ" onchange="javascript:BPModulo_Placarfutebolv2.change(this.value, this.selectedIndex);">';
		if(campeonatos)
		for(var k in campeonatos) {				
			camp_list += '<option value="'+campeonatos[k].link+'"'+(campeonatos[k].nome[0] === this.campeonato_atual ? 'selected="selected"' : '')+'>'+ campeonatos[k].nome[1]+'</option>';
		}
		for(var j in jogos) {
			lista += '<option value="'+jogos[j].link+'"'+(jogos[j].link == this.jogo_atual ? 'selected="selected"' : '')+'>'+(jogos[j].status == "" ? jogos[j].horario : jogos[j].status)+' - '+jogos[j].time1+' x '+jogos[j].time2+'</option>';
		}
		lista += "</select>";
		lista += '<a class="mais" href="http://esporte.uol.com.br/futebol/" target="_blank">Veja mais em UOL Esporte</a>';

		camp_list += "</select>";
		this.markup.combo_campe["obj"].innerHTML = camp_list;
		this.markup.combo["obj"].innerHTML = lista;
		
	},

	changeChamp : function(i) {
		var c = this.campeonatos[i];
		if(c) {
			this.campeonato_atual = c.nome[0];			
		} else {
			return null;		
		}
	},
	
	/**
	 * Troca o jogo que est� sendo visto
	 *
	 * @param String Path do arquivo json do jogo
	 */
	change : function(j, k) {
	
		if(arguments.length>1) {
			this.changeChamp(k);
			this.jogo_atual = null;
			this.loadJogos();					
			return;
		}
		var info = this.jogo_info;

		if(j == this.jogo_atual) return false;
		
		// troca a url
		this.jogo_atual = j;

		// chama m�todo que exibe as informa��es do jogo
		if(window.console) console.log("Jogo atual:" + this.jogo_atual);

		//this.loadJogos();		
		
		this.loadJogoAtual();		
		
		return true;
	},

	/**
	 * Exibe o tempo (prorroga��o, penalti ou jogo normal) do jogo atual
	 *
	 * @param Int Tempo do jogo [1- tempo normal, 2- prorroga��o, 3- penalti]
	 * @return Boolean
	 */
	tempo : function(t) {
		if(!this.hasTempo(t)) {
			return false;
		}

		// troca a aba ativa
		this.tempo_atual = t;

		// troca a classe do div onde ficam as narra��es e o penalti
		// para poder exibir via CSS o conte�do relevante.
		this.markup.lances["obj"].className = "tempo"+this.tempo_atual;
		this.markup.titulo["obj"].className = "tempo"+this.tempo_atual;

		return true;
	},

	/**
	 * Retorna true se o tempo que o usu�rio deseja ver
	 * est� dispon�vel para o jogo em quest�o.
	 *
	 * @param Int Tempo do jogo [1- tempo normal, 2- prorroga��o, 3- penalti]
	 * @return Boolean
	 */
	hasTempo : function(t) {
		switch(+t) {
			case 1:
				return true;
			break;

			case 2:
				/*for(var i in BPModulo_Placarfutebolv2.jogo_info.Lances) {
					if(BPModulo_Placarfutebolv2.jogo_info.Lances[i].tempoJogo.indexOf("Prorroga��o") > -1)
						return true;
				}*/

				return false;
			break;
		
			case 3:
				return (this.jogo_info.Status.penaltis != "false")
			break;
		}

		return false;
	},

	/**
	 * Faz as a��es para que as informa��es do jogo possam ser
	 * exibidas.
	 **/
	mount : function() {
		var info = this.jogo_info;

		this.markup.titulo["obj"].innerHTML = this.headerPlacar(info);

		BPDOM.remove("table-lances");

		var tabela = BPDOM.create("table", {"id" : "table-lances", "cellPadding" : "0", "cellSpacing" : "0"});
		var tbody  = BPDOM.create("tbody", {});

		for(var l in info.Lances) {
			var lance = info.Lances[l];
					lance.acao = +lance.acao; // transforma em (int)

			// Cria a linha da tabela
			var linha = BPDOM.create("tr", {});

			// o minuto ser� mostrado apenas em coment�rios do jogo
			// em a��es como 'texto' ou 'destaque', a coluna � ocultada
			if(lance.acao == 5 || lance.acao == 6) {
				// Coluna com o texto
				BPDOM.create("th", {
					"className": this.classAcao(lance.acao),
					"text" : lance.link == "" ? lance.comentario : '<a href="'+lance.link+'" target="_blank">'+lance.comentario+'</a>' + (lance.icone != "" ? '<img src="http://img.uol.com.br/ico_'+lance.icone+'.gif" />' : ''),
					"colSpan": "3"
				}, linha);
			}
			
			// demais a��es exigem 3 colunas:
			//  - primeira com o tempo do coment�rio
			//  - segunda com �cone -- caso exista
			//  - terceira com o coment�rio em si
			else {
				// Coluna com o minuto
				BPDOM.create("td", {
					"className": "tempo",
					"text": lance.tempo + "'"
				}, linha);

				// Coluna com o �cone de a��o
				BPDOM.create("td", {
					"className": this.classAcao(lance.acao),
					"text": '<span title="'+this.humanAcao(lance)+'">&nbsp;</span>'
				}, linha);

				// Coluna com o coment�rio / lance do jogo
				BPDOM.create("th", {
					"text" : lance.comentario
				}, linha);
			}
			
			// adiciona a linha criada � tabela
			BPDOM.append(linha, tbody);
		}

		BPDOM.append(tbody, tabela);
		BPDOM.append(tabela, this.markup.lances["obj"]);
		
		// Penaltis
		this.mountPenaltis();

		if(!this.hasTempo(this.tempo_atual)) {
			this.tempo_atual = 1;
		}

		this.markup.lances["obj"].className = "tempo"+this.tempo_atual;
		this.markup.titulo["obj"].className = "tempo"+this.tempo_atual;
	},


	/**
	 * Monta o markup da tabela de penaltis.
	 *
	 * @return Markup
	 */
	mountPenaltis : function() {
		var infos = this.jogo_info;
		var penaltis = this.jogo_info.Penaltis;

		if(infos.Status.penaltis == "false") {
			return false;
		}

		BPDOM.remove("table-penaltis");

		var tabela = BPDOM.create("table", {"id" : "table-penaltis", "cellPadding" : "0", "cellSpacing" : "0"});
		var thead = BPDOM.create("thead", {});
		var tbody  = BPDOM.create("tbody", {});

		if(penaltis.length > 0) {

			// Pega o placar dos penaltis
			var placar = (function(p) {
				var placar = [];
				placar[BPModulo_Placarfutebolv2.jogo_info.Times[0].nome] = 0;
				placar[BPModulo_Placarfutebolv2.jogo_info.Times[1].nome] = 0;

				for(p in penaltis) {
					placar[penaltis[p].time] += (penaltis[p].cobranca == 1 ? 0 : 1);
				}

				return placar;
			})();
			

			var time1 = penaltis[0].time;
			var time2 = penaltis[1] ? penaltis[1].time : ( penaltis[0].time == infos.Times[0].nome ? infos.Times[1].nome : infos.Times[0].nome );
			var linha = BPDOM.create("tr", {});

			BPDOM.create("th", {
				"text": time1 + " ("+placar[time1]+")"
			}, linha);

			BPDOM.create("th", {
				"text": time2 + " ("+placar[time2]+")"
			}, linha);
			
			BPDOM.append(linha, thead);
		}

		for(var p = 0; p < penaltis.length; p+=2) {
			var linha = BPDOM.create("tr", {});

			BPDOM.create("th", {
				"className" : "time1 cobranca" + penaltis[p].cobranca,
				"text" : "<span></span>"+penaltis[p].jogador
			}, linha);

			if(penaltis[p+1]) {
				BPDOM.create("th", {
					"className" : "time2 cobranca" + penaltis[p+1].cobranca,
					"text" : "<span></span>"+penaltis[p+1].jogador
				}, linha);
			}
			else {
				BPDOM.create("th", {
					"className" : "time2 aguardando",
					"text" : "&nbsp;"
				}, linha);
			}

			BPDOM.append(linha, tbody);
		}

		// Adiciona o �ltimo coment�rio
		if(penaltis.length > 0 && penaltis[penaltis.length-1].comentario != "") {
			var linha = BPDOM.create("tr", {});
			BPDOM.create("td", {
				"colSpan": 2,
				"className": "comentario",
				"text": penaltis[penaltis.length-1].comentario
			}, linha);

			BPDOM.append(linha, tbody);
		}

		BPDOM.append(thead, tabela);
		BPDOM.append(tbody, tabela);
		BPDOM.append(tabela, this.markup.lances["obj"]);
	},

	/**
	 * Retorna o markup do cabe�alho (info de placar + abas dos tempos) do jogo
	 * em acompanhamento.
	 *
	 * @param Object Infos do jogo
	 * @return String Markup do cabe�alho
	 */
	headerPlacar : function(info) {
		var header = (info.Status.jogo == "encerrada" ? '<span class="status">Encerrado: </span>' : '')+'<span class="nome time1">'+info.Times[0].nome+'</span><span class="placar time1">'+info.Times[0].gols+'</span><strong>x</strong><span class="placar time2">'+info.Times[1].gols+'</span><span class="nome time1">'+info.Times[1].nome+'</span>';
		
		var has_prorrogacao = this.hasTempo(2);
		var has_penalti = this.hasTempo(3);
		
		// se tem aba de p�nalti
		if(has_prorrogacao || has_penalti) {
			header += '<div class="abas">';
			header += '<a onclick="BPModulo_Placarfutebolv2.tempo(1)" id="placar_aba_tempo1" class="aba tempo1">Tempo normal</a>';

			//if(has_prorrogacao) {
			//	header += '<a onclick="BPModulo_Placarfutebolv2.tempo(2)" id="placar_aba_tempo2" class="aba tempo2">Prorroga��o</a>';
			//}

			if(has_penalti) {
				header += '<a onclick="BPModulo_Placarfutebolv2.tempo(3)" id="placar_aba_tempo3" class="aba tempo3">Penaltis</a>';
			}
			header += '</div>';
		}
		
		header += '<p class="infos">'+info.Info.data+' - '+info.Info.hora+' / Est�dio: '+info.Info.estadio+'</p>';
		
		return header;
	},

	/**
	 * Retorna um texto "humano" para cada a��o
	 *
	 * @param Object Objeto com os dados do lance
	 **/
	humanAcao : function(lance) {
		switch(+lance.acao) {
			case -1:
				return lance.time + ": Gol contra de " + lance.jogador;
			break;

			case 1:
				return lance.time + ": Gol de " + lance.jogador;
			break;

			case 2:
				return lance.time + ": Cart�o amarelo para " + lance.jogador;
			break;
		
			case 3:
				return lance.time + ": Cart�o vermelho para " + lance.jogador;
			break;

			case 4:
				return lance.time + ": " +lance.substituto + " entrou no lugar de " + lance.jogador;
			break;

			default:
				return "";
			break;
		}
	},

	/**
	 * Retorna a classe que deve ser adicionado na coluna da
	 * narra��o, conforme c�digo a��o.
	 *
	 * @param Int C�digo da a��o da narra��o
	 **/
	classAcao : function(acao) {
		switch(+acao) {
			case -1:
				return "contra";
			break;
		
			case 0:
				return "comentario";
			break;
		
			case 1:
				return "gol";
			break;
		
			case 2:
				return "amarelo";
			break;
		
			case 3:
				return "vermelho";
			break;
		
			case 4:
				return "substituicao";
			break;
		
			case 5:
				return "destaque";
			break;
		
			case 6:
				return "texto";
			break;
		
			default:
				return "comentario";
			break;
		}
	},

	__destroy : function() {
		console.log("Destruindo...");
		Cron.remove("update-jogo");
		Cron.remove("update-jogos");
	}
}


































