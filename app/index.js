import express from "express";
import cors from "cors";
import {
  getNovel,
  getChapter,
  getAllGenres,
  getNovelUpdates,
  getSearchNovel,
  getNovelHome,
  getNovelList,
  getNovelDirectory,
} from "./scrapper.js";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  const response = {
    availableEndpoints: {
      novelHome: {
        url: "/novel-home",
      },
      novelUpdates: {
        url: "/novel-updates/:page",
        params: {
          page: "ex: 1 | 2 | 3 | etc",
        },
      },
      ranking: {
        url: "/novel-ranking/:page/:sortBy",
        params: {
          sortBy: "top-rated | new | most-viewed",
          page: "ex: 1 | 2 | 3 | etc",
        },
      },
      novelByGenre: {
        url: "/novel-genre/:genre/:page/:sortBy",
        params: {
          sortby: "view | top_rated | new",
          genres: "ex: comedy | action | romance | drama | etc",
          page: "ex: 1 | 2 | 3 | etc",
        },
      },
      novelDirectory: {
        url: "/novel-directory/:alphabet",
        params: {
          alphabet: "ex: a | b | c | etc",
        },
      },
      search: {
        url: "/search/:query",
        params: {
          query: "ex: one piece | naruto | etc",
        },
      },
      allGenres: "/all-genres",
      novel: {
        url: "/novel/:slug",
        params: {
          slug: "ex: one-piece | naruto | etc",
        },
      },
      chapter: {
        url: "/chapter/:novelSlug/:chapter",
        params: {
          novelSlug: "ex: one-piece | naruto | etc",
          chapter: "ex: 1 | 2 | 3 | etc",
        },
      },
    },
  };
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/novel/:slug", async (req, res) => {
  const slug = req.params.slug;
  const response = await getNovel(slug);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/chapter/:novelSlug/:chapter", async (req, res) => {
  const novelSlug = req.params.novelSlug;
  const chapter = req.params.chapter;
  const response = await getChapter(novelSlug, chapter);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/all-genres", async (req, res) => {
  const response = await getAllGenres();
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/novel-updates/:page", async (req, res) => {
  const page = req.params.page;
  const response = await getNovelUpdates(page);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/novel-ranking/:page/:sortBy", async (req, res) => {
  const page = req.params.page;
  const sortBy = req.params.sortBy;
  const response = await getNovelList(page, sortBy, "ranking");
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/novel-genre/:genre/:page/:sortBy", async (req, res) => {
  const genre = req.params.genre;
  const page = req.params.page;
  const sortBy = req.params.sortBy;
  const response = await getNovelList(page, sortBy, "genre", genre);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/search/:query", async (req, res) => {
  const query = req.params.query;
  const response = await getSearchNovel(query);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/novel-home", async (req, res) => {
  const response = await getNovelHome();
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/novel-directory/:alphabet", async (req, res) => {
  const alphabet = req.params.alphabet;
  const response = await getNovelDirectory(alphabet);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.listen(3000, () => {
  console.log("App listening on port 3000!");
});
