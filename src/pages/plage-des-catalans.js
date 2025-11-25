import ArticleLayout from '../Components/ArticleLayout';
import blogPostArchive from '../blogPostArchive.json'

const Page = () => {
    const blog = blogPostArchive.find(blog => blog.title.toLowerCase() === "plage des catalans");
    const metadata = {
        topic: blog.topic,
        year: blog.year,
        director: blog.director,
        title: blog.title,
        author: 'Alex Stearn',
        keywords: 'Plage des Catalans Marseille',
        description: '',
      }

    return (
      <ArticleLayout metadata={metadata}>
        <p>Barely perceptible against the bright blue sky</p>
        <p>An old scar, a slither of white, calmly dangles over the sea</p>

        <p>If I look away it takes a moment to find it again</p>
        <p>As if shying away from my gaze</p>

        <p>But still it sits, waiting for night as the waves crash against the fading of the day</p>
      </ArticleLayout>
    )
}

export default Page;
