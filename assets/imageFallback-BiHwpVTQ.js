import{n as e,r as t}from"./client-W1GzSXzX.js";import{n}from"./text-DsHWmfJh.js";var r=[`Função do 1º grau

Toda função do 1º grau pode ser escrita como f(x) = ax + b, com a diferente de zero.

O coeficiente a é o coeficiente angular: ele diz a inclinação da reta. Quando a é positivo a função é crescente; quando a é negativo, decrescente.

O coeficiente b é o coeficiente linear: é o ponto em que a reta corta o eixo y.

Exemplo: em f(x) = 2x + 3, a reta sobe 2 unidades para cada unidade de x e corta o eixo y no ponto 3.`,`Leis de Newton

1ª lei — inércia: um corpo em repouso permanece em repouso, e um corpo em movimento mantém velocidade constante, a não ser que uma força atue sobre ele.

2ª lei: a força resultante é igual à massa vezes a aceleração. F = m · a.

3ª lei — ação e reação: para toda força de ação existe uma força de reação de mesma intensidade, mesma direção e sentido oposto.

Atenção: as forças de ação e reação atuam em corpos diferentes, e por isso não se cancelam.`,`Ciclo trigonométrico

O ciclo trigonométrico é uma circunferência de raio 1 com centro na origem.

O seno de um ângulo é a coordenada y do ponto correspondente; o cosseno é a coordenada x.

Valores notáveis: seno de 30 graus vale um meio; seno de 45 graus vale raiz de 2 sobre 2; seno de 60 graus vale raiz de 3 sobre 2.

Vale sempre a relação fundamental: seno ao quadrado mais cosseno ao quadrado é igual a 1.`,`Organelas celulares

Mitocôndria: produz energia pela respiração celular. É conhecida como a usina da célula.

Ribossomo: monta as proteínas a partir da informação trazida pelo RNA mensageiro.

Complexo de Golgi: empacota e distribui as proteínas produzidas.

Lisossomo: faz a digestão intracelular, quebrando o que a célula não usa mais.

Retículo endoplasmático: transporta substâncias dentro da célula.`,`Revolução Industrial

Começou na Inglaterra na segunda metade do século XVIII.

Causas principais: acúmulo de capital do comércio marítimo, mão de obra disponível pelo êxodo rural, e disponibilidade de carvão e ferro.

A máquina a vapor de James Watt permitiu multiplicar a produção e transformou o transporte.

Consequências: crescimento das cidades, surgimento do operariado urbano e jornadas de trabalho muito longas, que depois motivaram as primeiras leis trabalhistas.`];function i(e,t){let n=0;for(let t of e)n=(n*31+t.codePointAt(0))%1e5;return n%t}function a(e){return r[i(e,r.length)]}function o(e,t){let r=n(t);return r.length===0?e:e.filter(e=>n(e.name).includes(r)?!0:n(a(e.id)).includes(r))}function s(e,t){let n=new FormData;return n.append(`file`,e,e.name),n.append(`contentType`,t),n}function c(e,n,r){return t(`/api/child-folders/${e}/contents`,{method:`POST`,body:s(n,r)})}function l(e){return t(`/api/child-folders/${e}/contents`)}function u(e){return t(`/api/contents/${e}/download-url`)}function d(e,n){return t(`/api/contents/folder-suggestion`,{method:`POST`,body:s(e,n)})}function f(t){return t instanceof e&&(t.status===404||t.status===501)}function p(e,n){return t(`/api/contents/${e}/text`,{signal:n})}async function m(e,r,i){let a=new URLSearchParams({search:r});try{let s=await t(`/api/child-folders/${e}/contents?${a.toString()}`,{signal:i}),c=n(r);return s.filter(e=>n(e.name).includes(c)).length===s.length?s:o(s,r)}catch(t){if(f(t))return o(await l(e),r);throw t}}var h=`https://vmdibniuregpsjgnsnyc.supabase.co/storage/v1/object/public/revi`,g=`IMG_20240416_205313.jpg,IMG_4026.jpg,IMG_4027.jpg,IMG_4029.jpg,IMG_4031.jpg,IMG_20201209_101133625.jpg,IMG_20210216_163257096.jpg,IMG_20210216_163304708.jpg,IMG_20210216_165902708.jpg,IMG_20210216_170820753.jpg,IMG_20210218_104702250.jpg,IMG_20210915_182429961.jpg,IMG_20210915_182840485.jpg,IMG_20210915_183422163.jpg,IMG_20210915_183444586.jpg,IMG_20210916_182643003.jpg,IMG_20211105_175024081.jpg,IMG_20211111_154906471.jpg,IMG_20211125_163418879.jpg,IMG_20211125_163420515.jpg,IMG_20211217_084115144.jpg,IMG_20211217_101655528.jpg,IMG_20220203_164050999.jpg,IMG_20220203_164803850.jpg,IMG_20220204_145734130.jpg,IMG_20220204_170152743_1.jpg,IMG_20220207_163556074.jpg,IMG_20220207_163946781.jpg,IMG_20220207_163958897.jpg,IMG_20220207_164254983.jpg,IMG_20220207_164257108.jpg,IMG_20220207_172840371.jpg,IMG_20220207_172916982.jpg,IMG_20220207_173255961.jpg,IMG_20220207_173301594.jpg,IMG_20220207_173744469.jpg,IMG_20220207_173746525.jpg,IMG_20220207_174311491.jpg,IMG_20220207_174811651.jpg,IMG_20220207_174812907.jpg,IMG_20220207_175316970.jpg,IMG_20220207_175318888.jpg,IMG_20220208_154711277.jpg,IMG_20220208_154712285.jpg,IMG_20220208_154905868.jpg,IMG_20220210_164152048.jpg,IMG_20220210_164159644.jpg,IMG_20220210_164201409.jpg,IMG_20220211_173534758.jpg,IMG_20220211_173536057.jpg,IMG_20220211_174044885.jpg,IMG_20220211_174045553.jpg,IMG_20220211_174644106.jpg,IMG_20220211_174645189.jpg,IMG_20220211_175056529.jpg,IMG_20220211_175057452.jpg,IMG_20220211_175535093.jpg,IMG_20220211_175536230.jpg,IMG_20220211_175617752.jpg,IMG_20220211_175618638.jpg,IMG_20220214_144348907.jpg,IMG_20220214_150053901.jpg,IMG_20220214_150054866.jpg,IMG_20220214_150813320.jpg,IMG_20220214_150959734.jpg,IMG_20220214_151001200.jpg,IMG_20220214_151115371.jpg,IMG_20220214_151558357.jpg,IMG_20220214_151559179.jpg,IMG_20220221_173738111.jpg,IMG_20220221_173738797_1.jpg,IMG_20220304_144854820.jpg,IMG_20220308_171352172.jpg,IMG_20220308_171353151.jpg,IMG_20220308_171354970.jpg,IMG_20220316_184438879.jpg,IMG_20220316_184441155.jpg,IMG_20220316_184442031.jpg,IMG_20220323_134126442.jpg,IMG_20220323_134127613.jpg,IMG_20220323_134128553.jpg,IMG_20220325_134724881.jpg,IMG_20220325_134727331.jpg,IMG_20220325_163758925.jpg,IMG_20220328_134934812.jpg,IMG_20220328_191727472.jpg,IMG_20220513_152356397.jpg,IMG_20220513_152548128.jpg,IMG_20220513_152854998.jpg,IMG_20220513_153019827.jpg,IMG_20220513_153251737.jpg,IMG_20220513_154650178.jpg,IMG_20220517_152644703.jpg,IMG_20220517_152646087.jpg,IMG_20220517_153227868.jpg,IMG_20220517_165233425.jpg,IMG_20220530_142634146.jpg,IMG_20220607_145522793.jpg,IMG_20220607_145524291.jpg,IMG_20220613_181924979.jpg,IMG_20220624_144918241.jpg,IMG_20220702_122344987.jpg,IMG_20220702_122348067.jpg,IMG_20220829_140401520.jpg,IMG_20221025_173952.jpg,IMG_20221025_173953.jpg,IMG_20221103_175516.jpg,IMG_20221103_175520.jpg,IMG_20221108_140430.jpg,IMG_20221108_140432.jpg`.split(`,`);function _(e){let t=0;for(let n=0;n<e.length;n++)t=t*31+e.charCodeAt(n)>>>0;return t}function v(e){return`${h}/${g[_(e)%g.length]}`}export{m as a,l as i,p as n,d as o,u as r,c as s,v as t};