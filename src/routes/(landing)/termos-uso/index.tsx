import { Link } from "react-router";

import { LegalPage, type LegalSection } from "../components/LegalPage";

export function meta() {
  return [
    { title: "Termos de Uso — Revi" },
    {
      name: "description",
      content:
        "As regras para usar o Revi: quem pode criar conta, o que você pode enviar, os limites da Revi IA e o que o aplicativo garante (e o que não garante).",
    },
  ];
}

const sections: LegalSection[] = [
  {
    id: "aceitacao",
    title: "1. Aceitação destes Termos",
    body: (
      <>
        <p>
          Estes Termos de Uso regem o acesso e o uso do <strong>Revi</strong>,
          disponível em{" "}
          <a href="https://revi-jovi.vercel.app">revi-jovi.vercel.app</a> e no
          aplicativo instalado a partir dele. Ao criar uma conta ou usar o Revi,
          você concorda com estes Termos e com a{" "}
          <Link to="/politica-privacidade">Política de Privacidade</Link>. Se não
          concordar com algum ponto, não use o aplicativo.
        </p>
        <p>
          O Revi é mantido pelo grupo de estudantes autor do projeto, desenvolvido
          na FIAP (turma 1ESPW). O uso é gratuito e não há, hoje, nenhum plano
          pago.
        </p>
      </>
    ),
  },
  {
    id: "quem-pode-usar",
    title: "2. Quem pode usar",
    body: (
      <>
        <ul>
          <li>
            <strong>A idade mínima é 13 anos.</strong>
          </li>
          <li>
            <strong>
              Se você tem entre 13 e 17 anos, precisa da autorização de um dos
              pais ou do responsável legal
            </strong>{" "}
            para criar a conta e usar o aplicativo. Ao se cadastrar, você declara
            ter essa autorização.
          </li>
          <li>
            Pais e responsáveis que autorizam o uso assumem a responsabilidade
            pelos atos do adolescente no aplicativo e podem pedir a exclusão da
            conta a qualquer momento.
          </li>
        </ul>
        <p>
          Contas identificadas como pertencentes a menores de 13 anos são
          excluídas.
        </p>
      </>
    ),
  },
  {
    id: "o-que-e",
    title: "3. O que o Revi é — e em que estágio está",
    body: (
      <>
        <p>
          O Revi recebe o material de estudo que você fotografa ou envia,
          identifica a disciplina e o assunto, arquiva o arquivo nas suas pastas e
          gera, a partir dele, flash cards, resumo, simulado e mapa mental. Ele
          também acompanha a sua constância (Ascensão) e o seu desempenho
          (Trilha), e oferece uma camada social com amigos, ranking e turmas.
        </p>
        <p>
          <strong>
            O Revi é um projeto acadêmico em fase experimental (beta).
          </strong>{" "}
          Isso tem consequências práticas que você precisa conhecer antes de
          confiar material importante a ele:
        </p>
        <ul>
          <li>
            funcionalidades podem mudar, ser adicionadas ou removidas sem aviso;
          </li>
          <li>
            o serviço pode ficar indisponível a qualquer momento, inclusive de
            forma definitiva;
          </li>
          <li>
            <strong>
              não garantimos a preservação do material que você enviar
            </strong>{" "}
            — mantenha sempre uma cópia própria do que for importante.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "conta",
    title: "4. A sua conta",
    body: (
      <>
        <ul>
          <li>
            Informe um endereço de e-mail válido e do qual você tenha controle: é
            por ele que passam a verificação da conta e a recuperação de senha.
          </li>
          <li>
            <strong>Você é responsável por manter a sua senha em sigilo</strong> e
            por tudo o que acontecer na sua conta. Avise-nos imediatamente se
            suspeitar de uso indevido.
          </li>
          <li>
            Cada pessoa deve ter uma única conta, e a conta é pessoal — não
            empreste, não compartilhe e não transfira o acesso.
          </li>
          <li>
            Escolha um nome de usuário que não se passe por outra pessoa, marca ou
            instituição.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "seu-conteudo",
    title: "5. O material que você envia",
    body: (
      <>
        <p>
          <strong>O material continua sendo seu.</strong> Nós não reivindicamos
          propriedade sobre nada do que você envia ao Revi.
        </p>
        <p>
          Para que o aplicativo funcione, você nos concede uma licença gratuita,
          não exclusiva e limitada para armazenar, reproduzir, processar e exibir
          esse material, com a finalidade única de prestar o serviço a você — o
          que inclui enviá-lo a um provedor de inteligência artificial para
          extrair o texto e gerar o material de estudo, conforme descrito na{" "}
          <Link to="/politica-privacidade">Política de Privacidade</Link>. Se você
          publicar um conteúdo em uma turma, a licença se estende à exibição dele
          aos demais membros daquela turma.
        </p>
        <p>
          Essa licença termina quando você apaga o conteúdo ou a conta,
          ressalvadas as cópias técnicas temporárias e o conteúdo já publicado em
          turmas, que segue visível aos membros até ser removido.
        </p>
        <p>
          <strong>
            Você declara que tem o direito de enviar o material que envia.
          </strong>{" "}
          Fotografar a própria anotação de aula é uma coisa; digitalizar e
          compartilhar um livro inteiro, uma apostila protegida por direito autoral
          ou a prova de outra pessoa é outra. A responsabilidade por esse
          julgamento é sua.
        </p>
      </>
    ),
  },
  {
    id: "uso-aceitavel",
    title: "6. Uso aceitável",
    body: (
      <>
        <p>Ao usar o Revi, você se compromete a não:</p>
        <ul>
          <li>
            enviar ou publicar conteúdo ilegal, violento, discriminatório, de
            assédio, sexualmente explícito ou que exponha dados pessoais de
            terceiros;
          </li>
          <li>
            enviar material de terceiros sem autorização ou em violação a direito
            autoral, nem material sob sigilo;
          </li>
          <li>
            usar a conta de outra pessoa, se passar por alguém ou tentar obter
            acesso a dados que não são seus;
          </li>
          <li>
            automatizar o acesso, raspar conteúdo, contornar limites de requisição
            ou sobrecarregar a infraestrutura;
          </li>
          <li>
            inflar artificialmente o XP, manipular o ranking ou explorar falhas
            para obter vantagem;
          </li>
          <li>
            tentar burlar mecanismos de segurança, permissões de turma ou
            limitações de acesso;
          </li>
          <li>
            usar o Revi para fraudar avaliações ou para qualquer finalidade
            proibida pela instituição de ensino a que você pertence.
          </li>
        </ul>
        <p>
          Encontrou uma falha de segurança? Nos avise em{" "}
          <a href="mailto:contato@revi.app">contato@revi.app</a> em vez de
          explorá-la.
        </p>
      </>
    ),
  },
  {
    id: "turmas",
    title: "7. Turmas, amigos e ranking",
    body: (
      <>
        <p>
          A camada social é opcional, mas, ao usá-la, entenda o que ela expõe: o
          seu nome de usuário, o seu avatar, o seu XP, a sua posição no ranking, o
          seu número de amigos e as turmas em comum ficam visíveis para outras
          pessoas cadastradas. O seu e-mail não.
        </p>
        <ul>
          <li>
            Dentro de uma turma, o conteúdo que você publica fica visível para
            todos os membros dela, com o seu nome de usuário como autor — e
            continua lá se você sair da turma.
          </li>
          <li>
            O dono da turma pode remover qualquer conteúdo publicado nela,
            inclusive o seu, e pode remover membros.
          </li>
          <li>
            Só entre em turmas de pessoas que você conhece, e só compartilhe
            material que possa ser visto por todos os membros.
          </li>
        </ul>
        <p>
          Ainda não existe um canal de denúncia dentro do aplicativo. Para relatar
          conteúdo impróprio ou conduta abusiva, escreva para{" "}
          <a href="mailto:contato@revi.app">contato@revi.app</a>.
        </p>
      </>
    ),
  },
  {
    id: "limites-da-ia",
    title: "8. Os limites da Revi IA",
    body: (
      <>
        <p>
          <strong>A Revi IA erra.</strong> A leitura da foto pode falhar com letra
          cursiva, foto tremida ou página mal iluminada; o resumo pode omitir algo
          importante; uma questão de simulado pode ter enunciado ambíguo ou
          gabarito incorreto; a disciplina sugerida pode estar errada.
        </p>
        <ul>
          <li>
            O material gerado é <strong>apoio ao estudo</strong>, não fonte
            autoritativa. Confira sempre com o material original, com o livro e com
            quem ensina.
          </li>
          <li>
            O Revi não substitui aula, professor, orientação pedagógica nem
            qualquer tipo de aconselhamento profissional.
          </li>
          <li>
            Nenhum resultado no Revi — XP, posição no ranking, percentual de
            acerto — equivale a avaliação escolar ou certificação.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "terceiros",
    title: "9. Integrações de terceiros",
    body: (
      <>
        <p>
          As integrações com <strong>Google</strong> (Drive e Agenda) e{" "}
          <strong>Spotify</strong> são opcionais. Ao conectá-las, você passa a
          estar sujeito também aos termos e às políticas desses serviços, sobre os
          quais não temos controle.
        </p>
        <ul>
          <li>
            A reprodução de música pelo Spotify depende de uma assinatura Premium
            ativa — é uma exigência do próprio Spotify, não do Revi.
          </li>
          <li>
            Se você conectar o Google Agenda, o Revi cria, altera e exclui eventos
            no seu calendário principal para refletir as suas tarefas. Desconecte a
            integração se não quiser esse comportamento.
          </li>
          <li>
            Você pode revogar essas autorizações a qualquer momento, pelo Revi ou
            diretamente nas configurações de cada serviço.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "propriedade",
    title: "10. Propriedade intelectual do Revi",
    body: (
      <p>
        O nome Revi, a identidade visual, os textos, a interface e o software do
        aplicativo pertencem aos seus autores. Estes Termos não transferem nenhum
        desses direitos a você: o que você recebe é uma licença pessoal, limitada,
        revogável e não transferível para usar o aplicativo conforme aqui descrito.
        É vedado copiar, modificar, distribuir ou fazer engenharia reversa do
        aplicativo fora das hipóteses permitidas por lei.
      </p>
    ),
  },
  {
    id: "disponibilidade",
    title: "11. Disponibilidade e encerramento",
    body: (
      <>
        <p>
          O Revi é fornecido <strong>“no estado em que se encontra”</strong>, sem
          garantia de disponibilidade, de ausência de erros ou de adequação a uma
          finalidade específica. Não há acordo de nível de serviço.
        </p>
        <ul>
          <li>
            Podemos alterar, suspender ou encerrar o serviço, no todo ou em parte,
            a qualquer momento — inclusive ao fim do período letivo em que o
            projeto está inserido.
          </li>
          <li>
            Podemos suspender ou encerrar a sua conta em caso de violação destes
            Termos, de risco à segurança ou de exigência legal. Quando possível e
            razoável, avisaremos antes.
          </li>
          <li>
            Você pode parar de usar o Revi quando quiser. Para excluir a conta,
            escreva para{" "}
            <a href="mailto:privacidade@revi.app">privacidade@revi.app</a> — a
            exclusão pelo próprio aplicativo ainda não está disponível.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "12. Limitação de responsabilidade",
    body: (
      <>
        <p>
          Na máxima extensão permitida pela lei aplicável, os autores do Revi não
          respondem por lucros cessantes, perda de dados, perda de material de
          estudo, prejuízo em avaliações ou quaisquer danos indiretos decorrentes
          do uso ou da impossibilidade de uso do aplicativo, nem por conteúdo
          publicado por outros usuários ou por falhas de serviços de terceiros.
        </p>
        <p>
          <strong>
            Nada nesta seção afasta os direitos que você tem como consumidor
          </strong>{" "}
          nos termos do Código de Defesa do Consumidor e das demais normas de ordem
          pública aplicáveis.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "13. Mudanças nestes Termos",
    body: (
      <p>
        Podemos atualizar estes Termos para refletir mudanças no aplicativo ou na
        legislação. A data de atualização no topo da página sempre indica a versão
        vigente. Quando a mudança for relevante, avisaremos no aplicativo ou pelo
        e-mail cadastrado antes de ela passar a valer. Continuar usando o Revi
        depois disso significa concordar com a nova versão.
      </p>
    ),
  },
  {
    id: "lei-aplicavel",
    title: "14. Lei aplicável e foro",
    body: (
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica
        eleito o foro da comarca de São Paulo, estado de São Paulo, para dirimir
        controvérsias decorrentes deles, ressalvado o direito do consumidor de
        acionar o foro do seu domicílio.
      </p>
    ),
  },
  {
    id: "contato",
    title: "15. Contato",
    body: (
      <>
        <p>
          Dúvidas sobre estes Termos, relatos de conduta abusiva ou de falhas de
          segurança:
        </p>
        <p>
          <a href="mailto:contato@revi.app">contato@revi.app</a>
        </p>
        <p>
          Para assuntos de dados pessoais, o canal é{" "}
          <a href="mailto:privacidade@revi.app">privacidade@revi.app</a>, descrito
          na <Link to="/politica-privacidade">Política de Privacidade</Link>.
        </p>
      </>
    ),
  },
];

export default function TermosUsoPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      description="As regras do jogo: quem pode usar, o que você pode enviar, até onde vai a Revi IA e o que o aplicativo não promete."
      updatedAt="16 de setembro de 2026"
      sections={sections}
    />
  );
}
