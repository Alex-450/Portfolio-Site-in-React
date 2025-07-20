import ArticleLayout from '../../src/Components/ArticleLayout';
import blogPostArchive from '../blogPostArchive.json'

const Page = () => {
  const blog = blogPostArchive.find(blog => blog.filmTitle.toLowerCase() === "the hidden fortress");
  const metadata = {
    filmTitle: blog.filmTitle,
    year: blog.year,
    title: blog.title,
    director: blog.director,
    author: 'Alex Stearn',
    keywords: 'The Hidden Fortress, Akira Kurosawa, film anaylsis',
    description: '',
  }

  return (
    <ArticleLayout metadata={metadata}>
      <p>(SPOILERS AHEAD)</p>

      <p>
        <i>“…the happiness of these days - I would never have known living in the castle. I saw people as they really are. I saw their beauty… and their ugliness… with my own eyes … I can now die without regret”</i> - Princess Yuki
      </p>

      <p>
        Set against the backdrop of a civil war in medieval Japan, the protagonists of Akira Kurosawa’s The Hidden Fortress are never far away from death. We are introduced to the two hapless, greedy, scheming peasants Tahei and Matashichi as they attempt to escape Akizuki territory that has just been occupied by the neighbouring Yamana clan. They had left the peace of their home in Hayakawa with the hopes of making a fortune in the war, but had arrived too late and been forced to dig graves by the occupying army. In the opening sequence they witness a fleeing soldier being chased down and killed. Shortly afterwards Tahei sees another soldier shot whilst attempting to cross the newly closed and heavily guarded border between Akizuki and Hayakawa.
      </p>

      <p>
        Later on, they stumble across a piece of gold hidden in a stick and are discovered by the Akizuki General Rokurota, who has managed to escape the Yamana with the Princess Yuki and a large stash of gold, and is planning to escort her to the safety of Hayakawa. The general initially considers killing them, but when he learns of their plan to get home to Hayakawa by sneaking into Yamana territory and then back over the less closely guarded border between Yamana and Hayakawa, he decides to play on their greed and offer them a share of the gold in return for their help.
      </p>

      <p>
        The adventure that follows, sneaking behind enemy lines, constantly on the verge of capture and certain death is filled with suspense, comedy and a gradual changing of perspective for the Princess Yuki. She realises that living in the castle up until this point has left her isolated and out of touch, she doesn’t know the people that she has ruled. Despite Tahei and Matashichi’s almost constant attempts to betray both her and Rokurota and total obsession with finding fortune, she doesn’t seem to be scared of or disgusted by them. She bats them away and outwits them with seeming ease. She finds them entertaining. She has not encountered people who treat her like this in her sheltered upbringing, and they contrast totally with Rokurota, whose undying loyalty (to the point of sacrificing his own sister, Kofuyu, as a decoy) she utterly detests:
      </p>

      <p>
        <i>“Kofuyu was 16… I am 16. What difference is there in our souls?… If I was Kofuyu, I would curse this princess”</i>
      </p>

      <p>
        In contrast the two peasants would sell her out for a piece of gold in a heartbeat. They attempt to do exactly this as soon as they meet her, but are thwarted by Kofuyu being executed in her stead - leading them to believe that the princess is already dead. She seems comfortable in their company because they don’t believe that she is a princess and don’t treat her as one.
      </p>

      <p>
        At one point in their journey they are particularly close to capture and are forced to burn their cart of gold-filled firewood in order to blend in at a fire festival. As they dance ecstatically around the fire we see the peasants staring into the flames in horror, as their potential fortune slips away from them, whilst the princess smiles fully for the first time in the film, and abandons herself to the dance. Suddenly she has nothing and is indistinguishable from the crowd moving around her, she is finally living.
      </p>

      <p>
        When she is eventually captured and is facing execution, she realises that the richness of life might have passed her by had she spent all of her time in the castle. Her proximity to death has let her experience life more fully and see both the darkness and the light. She has been able to interact with people as if she were on their level, not as a princess to her subjects. She has proven herself capable not just of living in the real world, but of thriving.
      </p>

      <p>
        The film also points to the power of mercy and forgiveness in altering people. Rokurota spares a rival Yamana General Hyoe Tadokoro after defeating him in a duel, and Hyoe later helps him and Yuki escape captivity.  Princess Yuki saves one of her subjects from a life of sex work by ordering Rokurota to buy her from a tavern owner. When Tahei and Matashichi draw straws over taking advantage of the princess whilst she sleeps, it is the now fiercely loyal woman who has been saved from a life of constant exploitation who protects her. After finally making it to safety, rather than punishing Tahei and Matashichi for their constant betrayals, Princess Yuki gives them a piece of gold in reward for their efforts, telling them to share it equally and not to fight. Having spent the entirety of the film letting their greed get the better of them and come between them, they walk down the steps of the palace each trying to convince the other to keep the gold piece.
      </p>

      <p>
        <i>The Hidden Fortress</i> is an incredibly accessible film despite its age and setting, filled with laugh out loud moments and beautiful cinematography. It serves ultimately as a reminder to view life as an adventure, to accept the beautiful and the ugly, and to approach others with curiosity rather than judgement.
      </p>

      <hr />
    </ArticleLayout>
    );
  }

export default Page;
