//Criando a classe do Sprite
//Pode criar a classe como se fosse uma função
function Sprite(x, y, largura, altura) {
    this.x = x;
    this.y = y;
    this.largura = largura;
    this.altura = altura;

    this.desenha = function (xCanvas, yCanvas) { //onde vai desenhar na Cnvas 
        ctx.drawImage(img,this.x, this.y, this.largura, this.altura, xCanvas, yCanvas, this.largura, this.altura); //no jogo tbm terão mesma altura e largura
    }
}

var bg = new Sprite(0, 0, 1060, 600),
spriteBoneco = new Sprite(0,1000-400, 50, 75),

bonecoTriste = new Sprite(0,1000-109,89,109),
bonecoCaiu = new Sprite(90,1000-80,110,80),
bonecoRasteira = new Sprite(210,1000-104,117,104),
play = new Sprite(330,1000-198,192,198),
resultados = new Sprite(620,1000-168,446,168),
novo = new Sprite(148,1000-400,453,168),
vidavazia = new Sprite(92-1,1000-390-1,32,27),//aumentei um pouco a largura 
vidarosa = new Sprite(125-1,1000-390-1,32,27);

function SpriteSheet(x, y, larguraimg, alturaimg, ncaracters) {
    this.posicao = 0;
    this.x = x; //fixo
    this.y = y;
    this.n = ncaracters;
    this.largura = larguraimg/this.n;
    this.altura = alturaimg;

    this.desenha = function (xCanvas, yCanvas) { //onde vai desenhar na Cnvas 
        ctx.drawImage(img,this.x + this.largura*this.posicao, this.y, this.largura, this.altura, xCanvas, yCanvas, this.largura, this.altura);
    }
    this.movimenta = function () {
        this.posicao++;
        if (this.posicao==this.n)
            this.posicao = 0;
    }
}

var caracter = new SpriteSheet(626, 1000 - 400, 440, 98,6);