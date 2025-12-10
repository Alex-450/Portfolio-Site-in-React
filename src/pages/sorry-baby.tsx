import ArticleLayout from '../Components/ArticleLayout';
import YouTubeEmbed from '../Components/YouTubeEmbed';
import { ArticleMetadata } from '../types';
import { findBlogPost } from '../utils/blog';

const Page = () => {
  const blog = findBlogPost(b => b.topic.toLowerCase() === "sorry, baby");
  const metadata: ArticleMetadata = {
    topic: blog.topic,
    year: blog.year,
    title: blog.title,
    director: blog.director,
    author: 'Alex Stearn',
    keywords: 'Sorry Baby, Eva Victor, film anaylsis',
    description: '',
    spoilers: true
  }

  return (
    <ArticleLayout metadata={metadata}>
      <p>
        Something bad happened to Agnes, but <i>Sorry, Baby</i> doesn’t dwell for too long on the event itself - in fact we only hear about it through Agnes’ recollections, we do not see anything ourselves. Eva Victor focuses on how Agnes continues to live afterwards, and the things that help her through it. Everyone approaches trauma differently, and <i>Sorry, Baby</i> lets us into the mind of someone who approaches it with laughter and sardonic wit, someone who is naturally funny and sees the absurd in every situation, who can’t help but laugh when others might cry.
      </p>

      <p>
        You can question whether a black comedy is the right setting for a film that focuses on a character’s response to sexual assault, but it doesn’t make the exploration here any less poignant. The choice not to show the scene itself for example shows a clear indication of what the film is doing: focusing on the victim, not on the perpetrator (who gets relatively little screen time) and asking the question, how do you go on living after something like this happens?
      </p>

      <p>
        The answer offered by the film is through people who we can be ourselves around, friends who make us laugh and feel excited to be alive, partners who make us feel comfortable enough to be vulnerable, and pets that make us feel calm and protective. In one particularly touching scene a stranger helps Agnes to recover from a panic attack and then makes her a sandwich and sits with her whilst she eats. After experiences like these, we need reminding that although evil exists, there are good people everywhere as well.
      </p>

      <p>
        One interesting recurring motif is Vladimir Nabokov’s <i>Lolita</i>, which makes several appearances in the film. We see Agnes teaching a class where she asks whether reading the book made people feel uncomfortable, whether they were caught between admiring the form of the book and despising its content and felt somehow conflicted by that. The students agree that they feel this way, and it feels as if Victor is asking us if we feel this way about her film, do we feel uncomfortable laughing during a film about such a serious and unpleasant topic? It seems almost like she is anticipating some people’s reactions to the film and saying “I get it”. She understands that some people might not like this method of navigating trauma, or understand it, but that’s ok, we are simply witnessing one person's attempt to make sense of the world and their life after something happens that makes them question whether they can carry on living.
      </p>

      <hr></hr>
      <YouTubeEmbed videoId='Rc0jgWoZo9w'></YouTubeEmbed>
      <hr></hr>
    </ArticleLayout>
    );
  }

export default Page;
