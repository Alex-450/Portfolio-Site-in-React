import ArticleLayout from '../../src/Components/ArticleLayout';
import blogPostArchive from '../blogPostArchive.json'

const Page = () => {
    const blog = blogPostArchive.find(blog => blog.filmTitle.toLowerCase() === "marseille");
    const metadata = {
        year: blog.year,
        title: blog.title,
        author: 'Alex Stearn',
        keywords: 'Parc Longchamp Marseille',
        description: '',
      }

    return (
      <ArticleLayout metadata={metadata}>
        <p>The sun makes its way up the colonnades, the last light of the day slowly lifting up and leaving the sculptures and fountains in shadow, like the lights in a theatre gradually leaving the set in darkness. A man on a vespa speeds around the park, blowing a whistle, harrying people out of the gate. The pigeons take fright and explode off the steps en masse, gliding out of the park. Do they know it’s not closing time for them?  Two young girls skip down the path holding hands, making for the exit. The sky is still a crisp blue but the steps are quiet now, the man with the whistle has won. All life has been drained from the park and the sculptures gaze out into the fading light without admirers.</p>
      </ArticleLayout>
    )
}

export default Page;