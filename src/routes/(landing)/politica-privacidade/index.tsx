import { Link } from "react-router";

import { pageMeta } from "@/utils/pageMeta";
import { LegalPage, type LegalSection } from "../components/LegalPage";

export function meta() {
  return pageMeta({
    title: "Política de Privacidade",
    description:
      "Como o Revi trata os seus dados: o que coletamos, por quê, com quem compartilhamos e como você exerce os seus direitos.",
    indexable: true,
  });
}

const sections: LegalSection[] = [
  {
    id: "quem-somos",
    title: "1. Quem somos e o que este documento cobre",
    body: (
      <>
        <p>
          O <strong>Revi</strong> é um aplicativo de estudos que transforma o seu
          próprio material — a foto do caderno, da lousa ou da apostila — em flash
          cards, resumo, simulado e mapa mental. Ele é mantido pelo grupo de
          estudantes autor do projeto, desenvolvido na FIAP (turma 1ESPW), e está
          disponível em{" "}
          <a href="https://revi-jovi.vercel.app">revi-jovi.vercel.app</a>.
        </p>
        <p>
          <strong>
            O Revi está em fase experimental (beta) e não é um serviço comercial.
          </strong>{" "}
          Isso não muda o nosso compromisso com os seus dados, mas muda o que
          podemos prometer sobre disponibilidade e permanência — leia também os{" "}
          <Link to="/termos-uso">Termos de Uso</Link>.
        </p>
        <p>
          Esta política explica quais dados pessoais tratamos quando você usa o
          Revi, por quê, com quem compartilhamos e como você exerce os direitos
          que a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) garante a
          você. Ela vale para o site, para o aplicativo instalado no aparelho e
          para as integrações opcionais com Google e Spotify.
        </p>
      </>
    ),
  },
  {
    id: "resumo",
    title: "2. Resumo em uma tela",
    body: (
      <>
        <p>
          O documento inteiro está abaixo, mas estes são os pontos que realmente
          importam:
        </p>
        <ul>
          <li>
            <strong>
              Não exibimos anúncios, não rastreamos você e não vendemos dados.
            </strong>{" "}
            O Revi não usa nenhuma ferramenta de analytics, telemetria ou
            publicidade.
          </li>
          <li>
            <strong>
              As fotos e os arquivos que você envia saem do seu aparelho.
            </strong>{" "}
            Eles são guardados nos nossos servidores e enviados a um provedor de
            inteligência artificial para extrair o texto e gerar o material de
            estudo.
          </li>
          <li>
            <strong>
              Se você conectar o Google Agenda, o Revi passa a poder criar,
              alterar e excluir eventos
            </strong>{" "}
            no seu calendário principal. É a permissão mais forte que o aplicativo
            detém, e é opcional.
          </li>
          <li>
            <strong>Parte do seu perfil é visível para outras pessoas.</strong>{" "}
            Nome de usuário, avatar, XP e turmas em comum aparecem na busca, no
            ranking e nas turmas. O seu e-mail nunca aparece.
          </li>
          <li>
            <strong>Hoje não existe um botão para excluir a conta.</strong> O
            pedido é feito por e-mail e nós executamos.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "dados",
    title: "3. Quais dados tratamos",
    body: (
      <>
        <h3>Dados de conta</h3>
        <p>
          Para criar uma conta pedimos <strong>e-mail</strong>,{" "}
          <strong>nome de usuário</strong> e <strong>senha</strong> (mínimo de 8
          caracteres). Não pedimos nome completo, telefone, CPF, data de
          nascimento nem endereço. A senha é gerenciada por um servidor de
          identidade dedicado e guardada com algoritmo de hash — nem o aplicativo
          nem a nossa equipe conseguem lê-la. Também registramos se o seu e-mail
          já foi verificado e o endereço do seu avatar, que por padrão é uma
          ilustração gerada automaticamente.
        </p>

        <h3>Material de estudo</h3>
        <p>
          Guardamos os arquivos que você envia (fotos, imagens, PDFs, áudios e
          vídeos), os nomes das pastas e assuntos que você cria, o texto
          extraído desses arquivos — incluindo a transcrição do áudio ou do
          vídeo, com o tempo de cada trecho falado — e o material que a IA gera
          a partir dele: resumos, momentos-chave, flash cards, questões de
          simulado e mapas mentais.
        </p>

        <h3>Uso e desempenho</h3>
        <p>
          Registramos as suas tentativas de simulado — quantas questões, quantos
          acertos, em qual assunto e quando —, o que alimenta a Trilha, a Ascensão
          e o seu XP.
        </p>

        <h3>Dados da camada social</h3>
        <p>
          Quando você usa amigos, ranking ou turmas, tratamos as suas amizades e
          solicitações, as turmas de que participa, o seu papel em cada uma, os
          convites enviados e recebidos e o conteúdo que você publica em uma
          turma.
        </p>

        <h3>Dados técnicos</h3>
        <p>
          Os nossos servidores e o provedor de hospedagem registram, de forma
          automática, informações como endereço IP, data e hora do acesso e
          identificação do navegador. Usamos esses registros para segurança,
          diagnóstico de falhas e limitação de taxa.
        </p>

        <h3>Dados que ficam apenas no seu aparelho</h3>
        <p>
          Uma parte do Revi funciona sem enviar nada para lugar nenhum. Estes
          dados vivem no armazenamento local do seu navegador e{" "}
          <strong>são apagados se você limpar os dados do site</strong>:
        </p>
        <ul>
          <li>
            <strong>As suas tarefas</strong> — hoje a lista de tarefas existe
            somente no aparelho. Se você limpar o navegador, ela se perde. As
            cópias criadas no Google Agenda, se você conectou a integração,
            continuam lá.
          </li>
          <li>
            <strong>A sessão de estudos em andamento</strong>, as suas{" "}
            <strong>preferências</strong> (leitura automática, velocidade da
            fala), o <strong>tema</strong> claro ou escuro e as{" "}
            <strong>conquistas já exibidas</strong>.
          </li>
          <li>
            <strong>Os tokens de acesso</strong> do Revi e, se você conectar, os
            do Google e os do Spotify.
          </li>
        </ul>
        <p>
          O aplicativo também mantém um cache de páginas e fontes para funcionar
          com conexão instável. Esse cache é técnico e não é usado para medir o
          seu comportamento.
        </p>
      </>
    ),
  },
  {
    id: "camera",
    title: "4. Câmera",
    body: (
      <>
        <p>
          A câmera só é acionada depois que você autoriza no próprio navegador, e
          apenas nas telas em que você escolheu fotografar. Usamos somente a
          câmera traseira e somente vídeo —{" "}
          <strong>
            o Revi não captura áudio e não acessa a sua localização
          </strong>
          .
        </p>
        <p>
          A imagem fica no seu aparelho enquanto você a revisa. Ela só é
          transmitida para os nossos servidores quando você confirma o envio ou
          quando pede a sugestão automática de pasta.
        </p>
      </>
    ),
  },
  {
    id: "integracoes",
    title: "5. Integrações opcionais: Google e Spotify",
    body: (
      <>
        <p>
          As duas integrações são opcionais, ficam desligadas por padrão e podem
          ser desconectadas a qualquer momento. O Revi só recebe as permissões que
          você aprovar na tela do próprio Google ou do próprio Spotify.
        </p>

        <h3>Google</h3>
        <p>O Revi solicita três permissões, e nenhuma a mais:</p>
        <ul>
          <li>
            <strong>Arquivos selecionados do Google Drive</strong> — o Revi
            enxerga <strong>apenas os arquivos que você escolhe</strong> na janela
            de seleção do Google, um a um. Ele não lista, não busca e não acessa o
            resto do seu Drive.
          </li>
          <li>
            <strong>Eventos do Google Agenda</strong> — permite criar, alterar e
            excluir eventos do seu calendário principal, para manter as tarefas do
            Revi sincronizadas. Os eventos criados contêm o título da tarefa, o
            assunto ou a pasta relacionada, o horário e um link de volta para o
            Revi.
          </li>
          <li>
            <strong>O seu endereço de e-mail do Google</strong> — usado apenas
            para mostrar qual conta está conectada. Não lemos o seu nome, a sua
            foto nem qualquer outro dado do seu perfil Google.
          </li>
        </ul>
        <p>
          A conexão acontece inteiramente no seu navegador. A autorização do
          Google fica guardada no seu aparelho, vale cerca de uma hora e{" "}
          <strong>
            é apagada automaticamente quando você sai da sua conta no Revi
          </strong>{" "}
          — justamente porque ela dá acesso de escrita à sua agenda. Você pode
          revogar o acesso quando quiser em{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noreferrer"
          >
            myaccount.google.com/permissions
          </a>
          .
        </p>
        <p>
          <strong>Uso limitado.</strong> O uso e a transferência, pelo Revi, de
          informações recebidas das APIs do Google seguem a{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
          >
            Política de Dados do Usuário dos Serviços de API do Google
          </a>
          , inclusive os requisitos de Uso Limitado. Não usamos esses dados para
          publicidade, não os vendemos e não permitimos que pessoas os leiam,
          salvo com a sua autorização expressa, por exigência legal ou para
          operações internas de segurança.
        </p>

        <h3>Spotify</h3>
        <p>
          Serve apenas para tocar música durante a sessão de estudo. O Revi pede
          permissão para <strong>controlar a reprodução</strong> (tocar e pausar),{" "}
          <strong>ler o que está tocando</strong> e{" "}
          <strong>ler o tipo da sua conta</strong> — para saber se ela é Premium,
          o que o Spotify exige para controlar a reprodução. Não acessamos as suas
          playlists, a sua biblioteca nem o seu histórico de audição.
        </p>
        <p>
          Diferente do Google, a conexão com o Spotify{" "}
          <strong>
            continua ativa mesmo depois que você sai da sua conta no Revi
          </strong>
          , para não precisar reconectar a cada sessão. Para desconectar, use a
          opção correspondente no seu Perfil ou remova o Revi em{" "}
          <a
            href="https://www.spotify.com/account/apps/"
            target="_blank"
            rel="noreferrer"
          >
            spotify.com/account/apps
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "ia",
    title: "6. Revi IA: o que é enviado e para quem",
    body: (
      <>
        <p>
          Tudo o que o Revi apresenta como <strong>Revi IA</strong> depende de
          provedores externos de inteligência artificial — hoje a{" "}
          <strong>OpenAI</strong>, para extrair texto de imagens e gerar o
          material de estudo, e, para transcrever áudio e vídeo, a{" "}
          <strong>OpenAI</strong> ou a <strong>Mistral AI</strong>, conforme o
          provedor configurado no momento. Qualquer um deles pode ser substituído
          por um provedor compatível no futuro.
        </p>
        <p>São enviados a esses provedores:</p>
        <ul>
          <li>
            <strong>As imagens</strong> que você envia, para extração do texto
            (OCR).
          </li>
          <li>
            <strong>O áudio ou o vídeo</strong> que você envia, para gerar a
            transcrição com o tempo de cada trecho falado, o resumo, os
            momentos-chave e os demais materiais gerados a partir dele.
          </li>
          <li>
            <strong>O texto</strong> extraído das imagens, dos PDFs e das
            transcrições de áudio e vídeo, para gerar resumo, flash cards,
            questões de simulado e mapa mental, e para sugerir em qual
            disciplina e assunto o material se encaixa.
          </li>
        </ul>
        <p>
          No caso dos PDFs, a leitura da camada de texto é feita nos nossos
          próprios servidores; só o texto resultante segue para a IA. No caso do
          vídeo, extraímos a faixa de áudio também nos nossos próprios
          servidores antes de transcrever — apenas o áudio extraído, nunca a
          imagem do vídeo, segue para o provedor de transcrição. O texto
          extraído é guardado junto ao material, para você poder buscar por ele e
          ouvi-lo em voz alta.
        </p>
        <p>
          <strong>Não usamos o seu material para treinar modelos de IA.</strong> O
          processamento é feito sob contrato de uso de API, e o resultado volta
          para a sua conta.
        </p>
        <p>
          A leitura em voz alta é uma exceção: ela usa o sintetizador de voz do
          próprio navegador, sem enviar nada pela rede.
        </p>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "7. Com quem compartilhamos",
    body: (
      <>
        <p>
          <strong>
            Não vendemos os seus dados e não os cedemos para publicidade.
          </strong>{" "}
          Compartilhamos apenas o necessário para o Revi funcionar, com os
          prestadores abaixo, que atuam como operadores:
        </p>
        <ul>
          <li>
            <strong>Hospedagem do site e da API</strong> — servem as páginas e
            processam as requisições; têm acesso técnico aos registros de acesso.
          </li>
          <li>
            <strong>
              Provedores de inteligência artificial (OpenAI e, para
              transcrição de áudio e vídeo, também a Mistral AI, ou
              compatíveis)
            </strong>{" "}
            — recebem as imagens, os áudios, os vídeos e os textos descritos na
            seção anterior.
          </li>
          <li>
            <strong>Provedor de envio de e-mail</strong> — entrega as mensagens de
            verificação de conta e de redefinição de senha; recebe o seu endereço
            de e-mail.
          </li>
          <li>
            <strong>Serviço de avatares ilustrados</strong> — gera a imagem padrão
            do seu perfil a partir de um identificador aleatório.
          </li>
          <li>
            <strong>Google Fonts</strong> — entrega as fontes tipográficas do
            aplicativo.
          </li>
          <li>
            <strong>Google e Spotify</strong> — somente se você conectar as
            integrações, e apenas no escopo descrito na seção anterior.
          </li>
        </ul>
        <p>
          <strong>Compartilhamento com outras pessoas.</strong> A camada social do
          Revi foi feita para ser vista: o seu nome de usuário, o seu avatar, o
          seu XP, a sua posição no ranking, o seu número de amigos, os amigos em
          comum e as turmas em comum ficam visíveis para outras pessoas
          cadastradas — e o seu nome de usuário pode ser encontrado pela busca.
          Dentro de uma turma, todos os membros veem as pastas, os arquivos e o
          material que você publicar ali, com o seu nome de usuário como autor.
        </p>
        <p>
          <strong>O seu e-mail nunca é exibido a outros usuários</strong>, em
          nenhuma dessas telas. O material que você guarda nas suas próprias
          pastas também é privado: ele só é compartilhado se você o publicar em
          uma turma.
        </p>
        <p>
          Também podemos divulgar dados quando houver obrigação legal, ordem
          judicial ou requisição de autoridade competente.
        </p>
      </>
    ),
  },
  {
    id: "bases-legais",
    title: "8. Por que podemos tratar esses dados",
    body: (
      <>
        <p>
          Cada tratamento descrito aqui se apoia em uma das bases legais do artigo
          7º da LGPD:
        </p>
        <ul>
          <li>
            <strong>Execução de contrato</strong> — criar e manter a sua conta,
            guardar o seu material, gerar o material de estudo, registrar o seu
            desempenho e operar a camada social. Sem isso o Revi não faz o que
            você pediu que ele fizesse.
          </li>
          <li>
            <strong>Consentimento</strong> — o acesso à câmera e as integrações
            com Google e Spotify. Você o concede no momento da permissão e pode
            retirá-lo a qualquer momento, desconectando a integração ou revogando
            a permissão no navegador.
          </li>
          <li>
            <strong>Legítimo interesse</strong> — registros de acesso, limitação
            de taxa e demais medidas de segurança e de prevenção a fraude e abuso.
          </li>
          <li>
            <strong>Cumprimento de obrigação legal ou regulatória</strong> —
            quando a lei exigir a guarda ou a apresentação de informações.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "menores",
    title: "9. Crianças e adolescentes",
    body: (
      <>
        <p>
          O Revi foi pensado para quem estuda, e boa parte desse público tem menos
          de 18 anos. Por isso tratamos este ponto com atenção específica, na
          forma do artigo 14 da LGPD.
        </p>
        <ul>
          <li>
            <strong>A idade mínima para criar uma conta é 13 anos.</strong>
          </li>
          <li>
            <strong>
              Entre 13 e 17 anos, o uso depende da autorização e do acompanhamento
              de um dos pais ou do responsável legal
            </strong>
            , que deve ler esta política e os Termos de Uso antes de permitir o
            cadastro.
          </li>
          <li>
            Pedimos apenas os dados indispensáveis ao funcionamento do aplicativo.
            Não pedimos endereço, telefone, escola, série nem dados de pagamento,
            e nunca condicionamos uma funcionalidade à entrega de dados além do
            necessário.
          </li>
          <li>
            Antes de usar as turmas, o ranking ou a busca por amigos, é importante
            saber o que fica visível para outras pessoas: o nome de usuário e o
            avatar escolhidos.{" "}
            <strong>
              Recomendamos que menores de idade não usem o nome completo, a escola
              ou uma foto pessoal como identificação.
            </strong>
          </li>
        </ul>
        <p>
          Pais e responsáveis podem, a qualquer momento, pedir acesso aos dados do
          adolescente, a correção deles ou a exclusão da conta, escrevendo para{" "}
          <a href="mailto:privacidade@revi.app">privacidade@revi.app</a>. Se
          identificarmos uma conta criada por alguém com menos de 13 anos, ela
          será excluída.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    title: "10. Por quanto tempo guardamos e como apagar",
    body: (
      <>
        <p>
          Mantemos os seus dados enquanto a sua conta existir, porque é isso que
          permite você voltar amanhã e encontrar o seu material no lugar.
        </p>
        <ul>
          <li>
            <strong>
              Apagar uma pasta ou um assunto apaga tudo o que está dentro
            </strong>{" "}
            — os arquivos enviados, o texto extraído, os resumos, os flash cards e
            as questões —, tanto no banco de dados quanto no armazenamento de
            arquivos. A ação é imediata e não pode ser desfeita.
          </li>
          <li>
            <strong>Excluir a conta ainda não é possível dentro do aplicativo.</strong>{" "}
            Enquanto essa funcionalidade não existir, escreva para{" "}
            <a href="mailto:privacidade@revi.app">privacidade@revi.app</a> usando
            o e-mail cadastrado, e nós apagaremos a sua conta e os dados
            associados.
          </li>
          <li>
            Os dados guardados no seu aparelho somem quando você limpa os dados do
            site ou desinstala o aplicativo.
          </li>
          <li>
            Registros de acesso e de segurança são mantidos pelo prazo necessário
            às finalidades de segurança e ao cumprimento da legislação aplicável.
          </li>
        </ul>
        <p>
          O conteúdo que você publicou em uma turma permanece visível para os
          membros daquela turma, atribuído a você, mesmo que você saia dela. Se
          quiser removê-lo, apague-o antes de sair ou peça ao dono da turma.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "11. Os seus direitos",
    body: (
      <>
        <p>
          A LGPD garante a você, a qualquer momento e gratuitamente, o direito de:
        </p>
        <ul>
          <li>confirmar se tratamos dados seus e acessar esses dados;</li>
          <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>
            pedir a anonimização, o bloqueio ou a eliminação de dados
            desnecessários, excessivos ou tratados em desconformidade com a lei;
          </li>
          <li>
            pedir a portabilidade dos seus dados a outro fornecedor de serviço;
          </li>
          <li>
            pedir a eliminação dos dados tratados com base no seu consentimento;
          </li>
          <li>
            saber com quais entidades públicas e privadas compartilhamos os seus
            dados;
          </li>
          <li>
            ser informado sobre a possibilidade de não consentir e sobre as
            consequências disso;
          </li>
          <li>revogar o consentimento a qualquer momento.</li>
        </ul>
        <p>
          Para exercer qualquer um deles, escreva para{" "}
          <a href="mailto:privacidade@revi.app">privacidade@revi.app</a> a partir
          do e-mail cadastrado na sua conta. Respondemos em até 15 dias. Podemos
          pedir informações adicionais para confirmar que é você — nunca a sua
          senha.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "12. Segurança",
    body: (
      <>
        <p>Entre as medidas que adotamos:</p>
        <ul>
          <li>todo o tráfego acontece por conexão criptografada (HTTPS);</li>
          <li>
            as senhas são gerenciadas por um servidor de identidade dedicado e
            guardadas com algoritmo de hash, nunca em texto puro;
          </li>
          <li>
            o acesso à API usa tokens de curta duração, com renovação de uso único
            — um token de renovação já usado deixa de funcionar;
          </li>
          <li>
            cada conta só enxerga o próprio material: um pedido por um recurso de
            outra pessoa responde como se ele não existisse;
          </li>
          <li>
            os arquivos são servidos por links temporários, que expiram em pouco
            tempo;
          </li>
          <li>
            há limitação de taxa nos pontos sensíveis: login, cadastro,
            recuperação de senha e envio de arquivos.
          </li>
        </ul>
        <p>
          Ainda assim, nenhum sistema é infalível — e o Revi é um projeto em fase
          experimental, mantido por estudantes. Evite enviar ao aplicativo
          material sigiloso, documentos pessoais ou qualquer conteúdo cuja
          exposição possa causar dano. Se você identificar uma falha de segurança,
          escreva para{" "}
          <a href="mailto:privacidade@revi.app">privacidade@revi.app</a>.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "13. Cookies e armazenamento local",
    body: (
      <>
        <p>
          <strong>
            O Revi não usa cookies de rastreamento, de publicidade ou de análise
            de audiência.
          </strong>{" "}
          Não há nenhuma ferramenta de analytics instalada, e por isso não existe
          banner de consentimento de cookies.
        </p>
        <p>
          O que usamos é o armazenamento local do navegador, com finalidade
          estritamente funcional: manter você conectado, lembrar o tema e as
          preferências, guardar a sessão de estudos em andamento e as suas
          tarefas. Sem ele, o aplicativo não funciona.
        </p>
        <p>
          Se você conectar o Google ou o Spotify, esses serviços podem usar os
          próprios cookies nos domínios deles, conforme as respectivas políticas
          de privacidade.
        </p>
      </>
    ),
  },
  {
    id: "transferencia",
    title: "14. Transferência internacional de dados",
    body: (
      <p>
        Alguns dos prestadores que usamos — hospedagem, inteligência artificial e
        envio de e-mail — operam servidores fora do Brasil, especialmente nos
        Estados Unidos e na União Europeia. Nesses casos, a transferência é feita
        nos termos do artigo 33 da LGPD, com base na execução do contrato com você
        e mediante cláusulas contratuais que exigem do prestador nível de proteção
        compatível com a legislação brasileira.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "15. Mudanças nesta política",
    body: (
      <p>
        O Revi está em desenvolvimento ativo, e esta política vai mudar conforme
        novas funcionalidades entrarem. Sempre que isso acontecer, atualizamos a
        data no topo da página. Se a mudança for relevante — uma nova categoria de
        dado, um novo compartilhamento, uma nova finalidade —, avisaremos no
        próprio aplicativo ou pelo e-mail cadastrado antes de ela passar a valer.
      </p>
    ),
  },
  {
    id: "contato",
    title: "16. Contato",
    body: (
      <>
        <p>
          Dúvidas sobre esta política, pedidos de acesso ou de exclusão,
          solicitações de pais e responsáveis e relatos de incidente:
        </p>
        <p>
          <a href="mailto:privacidade@revi.app">privacidade@revi.app</a>
        </p>
        <p>
          O Revi é um projeto acadêmico desenvolvido por estudantes da FIAP (turma
          1ESPW), sem finalidade comercial. As condições de uso do aplicativo
          estão nos <Link to="/termos-uso">Termos de Uso</Link>.
        </p>
      </>
    ),
  },
];

export default function PoliticaPrivacidadePage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      description="O que o Revi coleta, por que coleta, com quem compartilha e como você decide sobre isso. Escrito para ser lido — sem letra miúda."
      updatedAt="22 de setembro de 2026"
      sections={sections}
    />
  );
}
