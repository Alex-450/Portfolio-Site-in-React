import ArticleLayout from '../Components/ArticleLayout';
import { CreativeWritingMetadata } from '../types';
import { findCreativeWritingPost } from '../utils/blog';

const Page = () => {
    const blog = findCreativeWritingPost(b => b.title.toLowerCase() === "plage des catalans");
    const metadata: CreativeWritingMetadata = {
        ...blog,
        keywords: 'Plage des Catalans Marseille',
      }

    return (
      <ArticleLayout metadata={metadata}>
        <p>Barely perceptible against the bright blue sky<br></br>
        An old scar,<br></br>
        a slither of white,<br></br>
        calmly dangles over the sea<br></br>
        If I look away it takes a moment to find it again<br></br>
        As if shying away from my gaze<br></br>
        But still it sits,<br></br>
        waiting for night,<br></br>
        as the waves crash against the fading of the day</p>
      </ArticleLayout>
    )
}

export default Page;
