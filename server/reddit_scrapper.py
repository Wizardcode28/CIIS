import os
import csv
import time
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Iterable, List, Optional
from dotenv import load_dotenv

import praw 
import prawcore
import pytz

logger = logging.getLogger("reddit_scraper")
logger.setLevel(logging.INFO)

load_dotenv()

# default queries (copied from your Selenium version)
political_queries: List[str] = [
    "india politics",
    "india protest",
    "india government fail",
    "india corruption",
    "india democracy threat",
    "india dictatorship",
    "india religious violence",
    "india communal riots",
    "india anti muslim",
    "india anti sikh",
    "india caste violence",
    "india hate speech",
    "india freedom struggle",
    "india human rights violation",
    "india farmers protest",
    "india caa protest",
    "india nrc protest",
    "india modi resign",
    "india bjp fail",
    "india rss agenda",
    "india fake news",
    "india propaganda",
    "india media blackout",
    "boycott india",
    "boycott indian products",
    "boycott bollywood",
    "kashmir freedom",
    "kashmir human rights",
    "kashmir india occupation",
    "kashmir protest",
    "khalistan movement",
    "punjab separatism",
    "anti national india",
    "down with india",
    "stop india aggression",
    "india pakistan conflict",
    "china india border",
    "india brutality",
    "india minority oppression"
]

def _init_reddit():
    """Initialize a PRAW Reddit instance using environment variables."""
    client_id = os.environ.get("REDDIT_CLIENT_ID")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
    user_agent = os.environ.get("REDDIT_USER_AGENT", "reddit_scraper:v1.0")

    if not client_id or not client_secret:
        raise EnvironmentError(
            "REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set as environment variables."
        )
  
    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
        check_for_async=False  # prevents accidental async loop issues
    )

def _format_time(created_utc: Optional[float]) -> str:
    """Return timestamp string in UTC 'YYYY-MM-DD HH:MM:SS' (fallback 'N/A')."""
    if not created_utc:
        return "N/A"
    # use UTC time for consistency
    dt = datetime.fromtimestamp(created_utc, tz=timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def scrape_reddit_to_csv(
    output_csv_path: str,
    per_query_limit: int,
    total_limit: int,
    delay_between_queries: float = 1.0
) -> int:
    """
    Scrape reddit using PRAW and save results to output_csv_path.
    - per_query_limit: max results to request per query (PRAW will respect rate limits)
    - total_limit: overall cap on number of rows written
    - returns: number of rows written
    """

    reddit = _init_reddit()

    Path(output_csv_path).parent.mkdir(parents=True, exist_ok=True)
    logger.info("Running PRAW scraper and saving CSV to %s", output_csv_path)

    written = 0
    seen_ids = set()

    header = ["Title", "Reference", "Score", "Comments", "Time", "Author", "Subreddit", "Description", "Url"]

    with open(output_csv_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(header)

        try:
            for query in political_queries:
                if written >= total_limit:
                    logger.info("Reached total_limit=%s, stopping.", total_limit)
                    break

                logger.info("Searching Reddit for query: %s (limit=%s)", query, per_query_limit)
                try:
                    # search on r/all
                    submissions = reddit.subreddit("all").search(query, sort="new", limit=per_query_limit)
                except prawcore.exceptions.RequestException as e:
                    logger.warning("Network error during PRAW search for '%s': %s", query, e)
                    time.sleep(2)
                    continue
                except Exception as e:
                    logger.exception("PRAW search failed for '%s': %s", query, e)
                    time.sleep(2)
                    continue

                keywords = [kw.lower() for kw in query.split() if kw.strip()]

                for sub in submissions:
                    if written >= total_limit:
                        break

                    try:
                        sid = getattr(sub, "id", None)
                        if not sid:
                            continue
                        if sid in seen_ids:
                            continue
                        seen_ids.add(sid)

                        title = getattr(sub, "title", "") or ""
                        reference = sid
                        score = getattr(sub, "score", 0) or 0
                        comments = getattr(sub, "num_comments", 0) or 0
                        created = _format_time(getattr(sub, "created_utc", None))
                        author = getattr(sub.author, "name", "deleted") if getattr(sub, "author", None) else "deleted"
                        subreddit = getattr(sub.subreddit, "display_name", "") or ""
                        description = getattr(sub, "selftext", "") or ""
                        url = getattr(sub, "url", "") or ""

                        # replicate the original filtering: ensure query keywords appear in title or description
                        text_for_check = f"{title} {description}".lower()
                        if keywords and not any(kw in text_for_check for kw in keywords):
                            # skip items that don't appear relevant
                            continue

                        writer.writerow([title, reference, score, comments, created, author, subreddit, description, url])
                        written += 1

                    except Exception as e:
                        # don't stop the whole scraper for one failing submission
                        logger.exception("Failed to process submission %s: %s", getattr(sub, "id", "<no-id>"), e)
                        continue

                # respectful delay between queries to reduce risk of rate limiting
                time.sleep(delay_between_queries)

        except KeyboardInterrupt:
            logger.warning("Scraper interrupted by user.")
        except Exception as e:
            logger.exception("Unhandled exception during scraping: %s", e)

    logger.info("Scraper finished: wrote %d rows to %s", written, output_csv_path)
    return written

