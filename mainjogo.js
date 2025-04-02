var canvas, ctx, ALTURA, LARGURA, VELOCIDADE = 6, maxPulos = 3,//vel em x
    estadoAtual, record, img,
    faseAtual = 0,
    ignorarClique = 0,

    sons = {
        novaFase: new Audio("level.mp3"),
        novaVida: new Audio("novavida.wav"),
        perdeuVida: new Audio("perdeuvida.wav"),
        perdeu: new Audio("perdeu.wav"),
        record: new Audio("record.wav"),
        jogando: new Audio("jogando.wav"),
        clique: new Audio("clique.wav")
    },

    labelNovaFase = {
        texto: "",
        opacidade: 0.0,

        fadeIn: function (dt) {
            var fadeInId = setInterval(function () { //setInterval repete toda vez em 10*dt segundos
                if (labelNovaFase.opacidade < 1.0)
                    labelNovaFase.opacidade += 0.01; //10ms
                else {
                    clearInterval(fadeInId); // para parar de ficar repetindo usa clearInterval
                }
            },
                10 * dt); //para o fadeIn demorar 10ms *100=1s
        },
        fadeOut: function (dt) {
            var fadeOutId = setInterval(function () {
                if (labelNovaFase.opacidade > 0.0)
                    labelNovaFase.opacidade -= 0.01;
                else
                    clearInterval(fadeOutId);
            },
                10 * dt);
        }
    }
estados = {
    JOGAR: 0,
    JOGANDO: 1,
    PERDEU: 2
},

    chao = {
        y: 550,
        altura: 50,
        cor: "#6A332E",

        desenha: function () {
            ctx.fillStyle = this.cor;
            ctx.fillRect(0, this.y, LARGURA, this.altura);
        }
    },

    background = {
        x: 0,
        largura: bg.largura,

        atualiza: function () {
            if (estadoAtual == estados.JOGANDO)
                this.x -= VELOCIDADE / 60;
            if (this.x < LARGURA - bg.largura)
                this.x = 0;
        },

        desenha: function () {
            bg.desenha(this.x, 0);
        }
    },
    bloco = {
        x: 50,
        y: 0, //comeca no 0 para fazer o efeito do boquinho caindo
        altura: caracter.altura,
        largura: caracter.largura,
        gravidade: 1.5, //fixo
        velocidade: 0, // velocidade do pulo! (eixo y)
        forcaDoPulo: 24, //na verdade ele pula 15-1.5=13.5 px
        qntPulos: 0,
        score: 0, //para incializar é com ":"
        tempoMovimenta: 5,

        vidas: 3,
        colidindo: false,

        atualiza: function () {
            this.velocidade += this.gravidade;
            this.y += this.velocidade; //aqui pula -15 em y, MUDA O Y!
            if (this.y > chao.y - this.altura && estadoAtual != estados.PERDEU) {//faz o bloquinho cair qnd perde
                this.y = chao.y - this.altura; // ele está sempre indo pra baixo...
                this.qntPulos = 0; //...pela gravidade, ele tbm nao pode ocupar o lugar do chao
                this.velocidade = 0;// dois corpos nao ocupam o mesmo lugar no espaço
            }

            if (estadoAtual == estados.JOGANDO) {
                if (!this.tempoMovimenta) {
                    caracter.movimenta();
                    this.tempoMovimenta = 5;
                }
                else
                    this.tempoMovimenta--;
            }
        },
        pula: function () {
            if (this.qntPulos < maxPulos) {
                this.velocidade = -this.forcaDoPulo;
                this.qntPulos++;
            }
        },
        reset: function () {
            this.velocidade = 0;
            this.y = 0;
            if (this.score > record) {
                localStorage.setItem("record", this.score);
                record = this.score;
            }
            this.score = 0;
            this.vidas = 3;
            faseAtual = 0;
            VELOCIDADE = 6;
        },
        desenha: function () {
            caracter.desenha(this.x, this.y);
        }
    },

    obstaculos = {
        _obs: [],
        _cores: ["#ffbc1c", "#ff1c1c", "#ff85e1", "#52a7ff", "#78ff5d"],
        tempoInsere: 0,

        insere: function () {
            this._obs.push({ //adiciona obs
                x: LARGURA,
                largura: 50,
                altura: 30 + Math.floor(120 * Math.random()),
                cor: this._cores[Math.floor(5 * Math.random())]
            });
            
            this.tempoInsere = 30 + Math.floor(30 * Math.random());
        },

        atualiza: function () { //aqui vê se perdeu
            if (!this.tempoInsere)
                this.insere(); //cria outro tempo de inserir
            else
                this.tempoInsere--;

            for (var i = 0; i < this._obs.length; i++) {
                var obs = this._obs[i];
                obs.x -= VELOCIDADE; // 600 é múltiplo de 6 entao chega em 0, mas se aumentar nao será mais

                if (!bloco.colidindo && bloco.x < obs.x + obs.largura && bloco.x + bloco.largura >= obs.x && bloco.y + bloco.altura >= chao.y - obs.altura) { //antes de tirar o obstaculo da tela
                    bloco.colidindo = true;

                    setTimeout(function () {
                        bloco.colidindo = false;
                    }, 500); //vai acontecer só depois de 500ms

                    if (bloco.vidas) {
                        sons.perdeuVida.play();
                        bloco.vidas--;
                    }
                    else {
                        estadoAtual = estados.PERDEU;
                        (bloco.score > record) ? sons.record.play() : sons.perdeu.play();
                        // HENRIQUE DEBUG: Aqui vc inicia um timeout assincrono, se der play novamente muito rapido, entao essa chamada vai pausar novamente
                        // setTimeout(function () {//termina de tocar a musica e ai para, nao 'e await que para os outros processos
                        //     sons.jogando.pause();
                        // }, (sons.jogando.duration - sons.jogando.currentTime) * 1000);
                        sons.jogando.loop = false;

                    }
                }
                else if (obs.x == !!(LARGURA % VELOCIDADE) * (LARGURA - Math.ceil(LARGURA / VELOCIDADE) * VELOCIDADE)) { //antes do bloco desaparecer ele sempre passa por x igual a 0, logo score++
                    bloco.score++;
                    if (bloco.score == Math.pow(2, faseAtual + 2))
                        passarDeFase();
                }
                else if (obs.x <= -obs.largura)
                    this._obs.splice(i, 1); //tira uma posição a partir do i
            }

        },

        limpa: function () {
            this._obs = [];
        },

        desenha: function () {
            for (var i = 0; i < this._obs.length; i++) {
                var obs = this._obs[i];
                ctx.fillStyle = obs.cor;
                ctx.fillRect(obs.x, chao.y - obs.altura, obs.largura, obs.altura);
            }
        }
    };

function passarDeFase() {
    VELOCIDADE++;
    faseAtual++;
    sons.novaFase.play();
    if (bloco.vidas < 3) {
        bloco.vidas++;
        sons.novaVida.play();
    }
    labelNovaFase.texto = "LEVEL " + faseAtual;
    labelNovaFase.fadeIn(0.4); //400ms
    setTimeout(function () { //setTimeOut ele deixa os outros rodando primeiro e só depois de 800ms roda o que esta dentro da função
        labelNovaFase.fadeOut(0.4); //400ms
    }, 800); //fica 400ms em 100% de opacidade  
}

function clique(event) {

    event.preventDefault();
    if(ignorarClique)
        return;

    if (estadoAtual == estados.JOGANDO) {
        bloco.pula();
        sons.clique.play();
    }
    else if (estadoAtual == estados.JOGAR) {
        console.log(`Iniciando o som`)
        estadoAtual = estados.JOGANDO;
        sons.jogando.loop = true;
        sons.jogando.currentTime = 0;
        sons.jogando.play(); //acontece só no inicio do jogo
    }
    else if (estadoAtual == estados.PERDEU && bloco.y > 2 * bloco.altura) {
        ignorarClique = 1;
        setTimeout(function () {
            ignorarClique = 0;
        }, 5000);

        // HENRIQUE DEBUG: Pausei o som de fundo pq no menu nao tem musica.
        //sons.jogando.pause();
        estadoAtual = estados.JOGAR;
        obstaculos.limpa();
        bloco.reset();
    }
}
function listenPressClick(f) {
    document.addEventListener("mousedown", f); //mouseover, click, mouseout
    // keydown, keyup, keypress
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            f(event);
        }
    });
}


function main() {
    ALTURA = window.innerHeight;
    LARGURA = window.innerWidth;

    if (LARGURA >= 500) { //width:30em
        LARGURA = 600;
        ALTURA = 600;
    }

    canvas = document.getElementById("canvas");
    canvas.width = LARGURA;
    canvas.height = ALTURA;
    canvas.style.border = "1px solid #000";
    ctx = canvas.getContext("2d"); // contexto

    record = localStorage.getItem("record"); //se encontrar usa, else record=null
    if (record == null)
        record = 0;

    img = new Image();
    img.src = "img.png";

    // A parte de cima so acontece uma vez

    estadoAtual = estados.JOGAR;
    listenPressClick(clique);
    roda();
}

function roda() {
    atualiza();
    desenha();
    window.requestAnimationFrame(roda); //gasta menos processamento
}
function atualiza() {
    background.atualiza();
    if (estadoAtual == estados.JOGANDO)
        obstaculos.atualiza();
    bloco.atualiza();
}
function desenha() { //nao pode tocar musica em desenha, porque essa f nao acontece so uma vez
    //backgroud aparece primeiro, as letras por cima ...
    background.desenha();
    vidavazia.desenha(600 - 40 - vidavazia.largura / 2, 30);
    vidavazia.desenha(600 - 40 - vidavazia.largura * 3 / 2, 30);
    vidavazia.desenha(600 - 40 - vidavazia.largura * 5 / 2, 30);
    for (var n = 0; n < bloco.vidas; n++) {// 2n+1 e depois para ir ao contrario, faça n =>2-n
        vidarosa.desenha(600 - 40 - vidarosa.largura * (2 * (2 - n) + 1) / 2, 30);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "50px Arial";
    ctx.fillText(bloco.score, 30, 30 + 38); //altura do digito sempre igual

    // Passar de Nivel -> desenhar
    ctx.fillStyle = "rgba(255,255,255," + labelNovaFase.opacidade + ")";
    ctx.fillText(labelNovaFase.texto, LARGURA / 2 - ctx.measureText(labelNovaFase.texto).width / 2, ALTURA / 3); // FICA UM POUCO MAIS PRA CIMA DO MEIO

    if (estadoAtual == estados.JOGAR) {
        play.desenha(LARGURA / 2 - play.largura / 2, ALTURA / 2 - play.altura / 2);
    }
    else if (estadoAtual == estados.PERDEU) {
        ctx.save();
        ctx.translate(LARGURA / 2, ALTURA / 2); //economiza digitar LARGURA/2, ALTURA/2 ...
        if (bloco.score > record) {
            novo.desenha(-resultados.largura / 2 - 30, -resultados.altura / 2);
            bonecoRasteira.desenha(-bonecoRasteira.largura / 2, -bonecoRasteira.altura / 2 - 110);
            ctx.fillStyle = "#fff";
            if (bloco.score < 10)
                ctx.fillText(bloco.score, -13, 34);
            else if (bloco.score < 100)
                ctx.fillText(bloco.score, -13 * 2, 34);
            else
                ctx.fillText(bloco.score, -13 * 3, 34);
        }
        else { //nao é record
            resultados.desenha(-resultados.largura / 2 - 30, -resultados.altura / 2);
            bonecoCaiu.desenha(-bonecoCaiu.largura / 2, -bonecoCaiu.altura / 2 - 95);
            ctx.fillStyle = "#fff";
            ctx.fillText(bloco.score, 70, -26);
            ctx.fillText(record, 70, 32);
        }
        ctx.restore();
    }
    else if (estadoAtual == estados.JOGANDO) {
        obstaculos.desenha();
    }

    chao.desenha();
    bloco.desenha();
}

//inicia o jogo
main();