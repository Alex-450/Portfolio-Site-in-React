import ArticleLayout from '../Components/ArticleLayout';
import YouTubeEmbed from '../Components/YouTubeEmbed';
import { findBlogPost, ArticleMetadata } from '../types';

const Page = () => {
  const blog = findBlogPost(b => b.topic.toLowerCase() === "fitzcarraldo");
  const metadata: ArticleMetadata = {
    topic: blog.topic,
    title: blog.title,
    year: blog.year,
    author: 'Alex Stearn',
    director: blog.director,
    keywords: 'Fitzcarraldo, Werner Herzog, Film analysis',
    description: 'At what point does the cost of art outweigh any benefit it could possibly have?...',
  }

  return (
    <ArticleLayout metadata={metadata}>
      <p>At what point does the cost of art outweigh any benefit it could possibly have? Werner Herzog seems to be asking this question both through the narrative of <i>Fitzcarraldo</i> and the evidently wildly ambitious manner in which it was filmed.</p>

      <p>It is almost impossible to separate the protagonist from the director, both seem hell-bent on delivering their art, <i>Fitzcarraldo</i> through opera and Herzog through film, that all other considerations fade into insignificance.</p>

      <p>Throughout the course of the film there is a constantly distracting element where you are questioning what it must have taken to get these shots, what it must have cost to portray this obsession so vividly. Fitzcarraldo wants to build an opera house, but first he must have money, so he needs to harvest rubber, so he needs land, he needs a boat to transport it, he needs to transport the boat over a mountain in order to reach his land. He never stops to question whether any of this is worth it, whether any of this makes any sense at all.</p>

      <p>He wants to literally move a mountain to stage an opera, but what of the human cost? The environmental cost? We see trees being felled in the Amazon, native tribe members being crushed under the weight of a boat as it is winched laboriously up the slope. We see Fitzcarraldo’s lover running a brothel, the proceeds from which he uses to buy his boat and pay his crew. Exploitation of the local inhabitants is total: physical, sexual and financial. The exploitation of the environment to serve his needs goes unquestioned.</p>

      <p>Can this be viewed as a critique of art within a capitalist system, of the extracting nature of colonialism? Of art being created in a world where only the final product matters, where any single part of the journey can be justified by its outcome? Can a film do that whilst simultaneously doing all of the same things? Can we watch a huge tree being felled on camera and not ask whether this should have been done for our entertainment? </p>

      <p>Or was that not the point we are supposed to take from this film? Are we supposed to simply see a man gone mad, a feverish obsession tipping him over the edge, the blurring of lines between visionary genius and ego-fuelled nightmare?</p>

      <p>It is impossible to see one without seeing the other, to see Klaus Kinski, sweat-drenched, mud-spattered, crazed, engaged in the Sisyphean task of pushing a boat up a mountain, without seeing Herzog on the other side of the camera, doing exactly the same thing.</p>

      <hr></hr>

      <YouTubeEmbed videoId='xWeb7i8IjYs'></YouTubeEmbed>
    </ArticleLayout>
    );
  }

export default Page;
