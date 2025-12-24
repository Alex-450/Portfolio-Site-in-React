import { YouTubeEmbedProps } from '../types';

const YouTubeEmbed = ({ videoId }: YouTubeEmbedProps) => {
  return (
    <div
      style={{
        position: 'relative',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        paddingTop: 25,
        height: 0,
      }}
    >
      <iframe
        title="YouTube video"
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '12px',
        }}
      />
    </div>
  );
};

export default YouTubeEmbed;
