import ArticleLayout from '../ArticleLayout';
import YouTubeEmbed from '../YouTubeEmbed';

const TwentyEightYearsLater = () => {
  const metadata = {
    filmTitle: '28 Years Later',
    title: "Love Letter / Obituary",
    year: '2025',
    director: 'Danny Boyle',
    author: 'Alex Stearn',
    keywords: '28 years later, Danny Boyle, Alex Garland film analysis',
    description: '',
  }
  return (
    <div>
      <ArticleLayout metadata={metadata}>
        <p>(SPOILERS AHEAD)</p>

        <p>Twenty three years after the events of <i>28 Days Later</i> (2002), a lot has changed. Danny Boyle’s first zombie film in the came out before the UK was battered by the divisive forces of Brexit and then Covid, the latter giving us scenes eerily reminiscent from the first film, with the streets of London deserted save for a few empty buses.</p>

        <p>In 28 Years Later, the virus has been contained to the UK, mainland Europe has set up a quarantine zone around the coast and patrols it regularly to ensure there are no breaches. The UK is now isolated from the rest of the world, the survivors that are left will have to fend for themselves and can have no expectation of rescue. We follow the movements of a young boy - Spike - who lives in a tight-knit community on the island of Lindisfarne (or Holy Island) where the inhabitants are protected from the rage virus consuming the mainland by a tidal causeway.
        </p>

        <p>The community is isolated, rooted in nostalgia, the young people are trained with bows and arrows and resources are shared but extremely limited, showers are taken in public to ensure no one uses more than their fair share of water. A tattered St George’s cross flutters in the breeze. The early scenes are interspersed with clips from Henry V and we get the sense that these people could be preparing to fight the French at Agincourt in the 1600s, rather than a horde of zombies in the 21st century.
        </p>

        <p>Spike’s mother Isla is sick, but no one knows what is wrong with her, there are no doctors left on the Holy Island. There’s a doctor on the mainland, but the locals don’t trust him, there are rumours that he’s gone mad and spends his time burning the bodies of the countless dead. The community’s isolation is their greatest protection but also stands in the way of any real salvation or progress. Culture and social change has regressed hundreds of years on the Holy Island, and no one has the courage to do anything about that in the face of the rage-infected horde.
        </p>

        <p>The parallels here with an isolated and broken UK are clear to see, goods are scarce and healthcare difficult to access, trust of outsiders is at an all time low. This is made even more brutally apparent by an interaction with a Swedish solider who gets marooned on the North Eastern coast when his boat sinks during a routine patrol. He struggles to explain concepts like the internet, smartphones and delivery drivers to Spike, all things that have not made it in our post-apocalyptic UK.
        </p>

        <p>It would be easy to view this as a sort of obituary for Britain, a lament for the self-enforced isolation and economic catastrophe that was Brexit, the chaotic handling of the pandemic under Boris Johnson that led to travel from the “Plague Island” to Europe being briefly banned [1]. There are also parallels in the way that Spike’s dad sensationalises his first trip to the mainland and brushing Spike off when he tries to explain that he was so shaken by what he saw there that he could hardly hold his bow by the end of their excursion. This sort of disregard for the truth has also become commonplace in public life in the last few decades.
        </p>

        <p>But that is not the only story being told here. As our hero traverses the countryside in search of the medical care that Isla so clearly needs, other themes become apparent. The landscapes are truly breathtaking, we pass the Sycamore Gap twice, with the tree still intact in this alternate universe, we pass through Cheddar Gorge and see the Angel of the North, surrounded by forest now, but still standing tall. The film at these points is a love letter to the North East of England, the landscapes made even more awe-inspiring by the eery quiet that envelops them. And despite the Holy Island community’s isolationist approach and fear-based setup, it is a true community, with everyone playing a role, and celebration through music and drinking a cornerstone of their communal life.
        </p>

        <p>Though the film’s message initially seems to be totally bleak, with the political allegory reinforcing the doom and gloom of the contemporary news cycle, there is a thread of hope running throughout. Families and communities might not be perfect, but they help us to survive even through the darkest of times. When we meet the doctor at last, we find that he has grown obsessed with death, erecting a monument to those who have died in the course of the outbreak in an attempt to remind people that they all will die. He repeats the latin phrase “memento mori” (remember you must die) a number of times and helps Spike to come to terms with the inevitable end of Isla’s life. Death is the only inevitability in this life, change the only constant. There is something that should make us feel optimistic in that, a reminder that all things pass. When Spike starts a fire to distract the guards at the gate and escape to the mainland with his mother, we see a site of the St George’s flag burning as he leaves: revolution through death and rebirth perhaps. The natural world healing itself as human impact lessens after the rage virus takes hold, with huge herds of deer stampeding across the lush fields and forests, are also a testament to this theme of renewal.</p>

        <p>In 28 Years Later we see a despairing look at the state of the UK, but not from someone who has given up hope, or fallen out of love with everything that is great about the island and its people.
        </p>

        <hr />
        <YouTubeEmbed videoId={'mcvLKldPM08'}></YouTubeEmbed>

        <hr />

        <h6><strong>Bibliography</strong></h6>

        <p>[1] <a target="_blank" rel="noreferrer" href="https://www.theguardian.com/world/2020/dec/22/worlds-media-ask-how-it-went-so-wrong-for-plague-island-britain-covid">https://www.theguardian.com/world/2020/dec/22/worlds-media-ask-how-it-went-so-wrong-for-plague-island-britain-covid</a>  [Accessed: 26 June 2025]</p>
      </ArticleLayout>
    </div>
    );
  }

export default TwentyEightYearsLater;
