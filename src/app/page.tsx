import { formatDistance } from "date-fns";
import styles from "./page.module.scss";
import Image from "next/image";

// Define the structure of a Hacker News story
interface Story {
  id: number;
  title: string;
  url: string;
  time: number;
  score: number;
  by: string;
  author: {
    karma: number;
  };
}

// Fetch the top story IDs from the Hacker News API
async function fetchTopStories(): Promise<number[]> {
  const response = await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
    { next: { revalidate: 60 } }
  );
  return response.json();
}

// Fetch details of a single story and its author
async function fetchStory(id: number): Promise<Story> {
  // Fetch story details
  const response = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
    { next: { revalidate: 60 } }
  );
  const story = await response.json();

  // Fetch author details
  const authorResponse = await fetch(
    `https://hacker-news.firebaseio.com/v0/user/${story.by}.json`,
    { next: { revalidate: 60 } }
  );
  const author = await authorResponse.json();

  // Combine story and author details
  return { ...story, author };
}

// Main component (Server Component)
export default async function Home() {
  // Fetch top story IDs
  const topStoryIds = await fetchTopStories();

  // Fetch details of the top 10 stories
  const stories = await Promise.all(topStoryIds.slice(0, 10).map(fetchStory));

  // Sort stories by score in ascending order
  stories.sort((a, b) => a.score - b.score);

  return (
    <main className={styles.main}>
      <h1 className={styles.pageTitle}>Hacker News Stories</h1>
      <ul className={styles.storyList} aria-label="Hacker News stories">
        {stories.map((story) => (
          <li key={story.id} className={styles.storyItem} role="link">
            <article>
              {/* Placeholder image using a public API */}
              <Image
                src={`https://picsum.photos/seed/${story.id}/200/200`}
                alt="Article thumbnail"
                className={styles.storyImage}
                width={200}
                height={200}
              />
              <div className={styles.storyContent}>
                <h2 className={styles.storyTitle}>
                  <a
                    aria-label={`${story.title} (opens in a new tab)`}
                    className={styles.storyUrl}
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {story.title}
                  </a>
                </h2>
                <p className={styles.storyMeta}>
                  <span>Score: {story.score}</span>
                  <span>Author: {story.by}</span>
                  <span>Karma: {story.author.karma}</span>
                  <span className={styles.storyTime}>
                    Posted:
                    {formatDistance(new Date(story.time * 1000), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
