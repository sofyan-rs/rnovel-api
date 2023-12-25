import * as cheerio from "cheerio";
import axios from "axios";
import NodeCache from "node-cache";
import { baseURL } from "./config.js";

const myCache = new NodeCache();

async function getNovel(slug) {
  if (myCache.has(`novel-${slug}`)) {
    return {
      message: "success",
      data: myCache.get(`novel-${slug}`),
    };
  } else {
    try {
      const res = await axios.get(`${baseURL}/${slug}`);
      const $ = cheerio.load(res.data);
      const title = $(".section-header-title.me-auto > h2.max-caracter-2:first")
        .text()
        .trim();
      const description = $(".col-md-12.mb-3 > .empty-box:last").text().trim();
      const cover = $(".novels-detail-left img").attr("src");
      const alternativeNames = $(
        '.novels-detail-right-in-left:contains("Alternative Names:")'
      )
        .next(".novels-detail-right-in-right")
        .find("span")
        .text()
        .trim();
      const status = $('.novels-detail-right-in-left:contains("Status:")')
        .next(".novels-detail-right-in-right")
        .text()
        .trim();
      const genres = $('.novels-detail-right-in-left:contains("Genres:")')
        .next(".novels-detail-right-in-right")
        .find("a")
        .map((index, element) => $(element).text())
        .get();
      const type = $('.novels-detail-right-in-left:contains("Type:")')
        .next(".novels-detail-right-in-right")
        .find("span")
        .text()
        .trim();
      const rating = $('.novels-detail-right-in-left:contains("Rating:")')
        .next(".novels-detail-right-in-right")
        .find("strong")
        .text()
        .trim();
      const author = $('.novels-detail-right-in-left:contains("Author(s):")')
        .next(".novels-detail-right-in-right")
        .find("a")
        .map((index, element) => $(element).text().trim())
        .get();
      const artist = $('.novels-detail-right-in-left:contains("Artist(s):")')
        .next(".novels-detail-right-in-right")
        .find("a")
        .map((index, element) => $(element).text().trim())
        .get();
      // Extract chapter numbers and slugs
      const chapters = [];
      $(".cm-tabs-content.novels-detail-chapters li a").each(
        (index, element) => {
          const chapterUrl = $(element).attr("href");
          const chapterNumber = $(element).text().replace("CH ", "").trim();
          const slug = chapterUrl
            .replace(`${baseURL}/`, "")
            .replace("chapter-", "");
          chapters.push({ chapterNumber, slug });
        }
      );
      const data = {
        title,
        description,
        cover,
        alternativeNames,
        status,
        genres,
        type,
        rating,
        author,
        artist,
        chapters,
      };
      myCache.set(`novel-${slug}`, data, 60);
      return {
        message: "success",
        data,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: {},
      };
    }
  }
}

async function getChapter(slug, chapter) {
  if (myCache.has(`${slug}-${chapter}`)) {
    return {
      message: "success",
      data: myCache.get(`${slug}-${chapter}`),
    };
  } else {
    try {
      const res = await axios.get(`${baseURL}/${slug}/chapter-${chapter}`);
      const $ = cheerio.load(res.data);
      const seriesTitle = $(".section-header-title.me-auto > .max-caracter-2")
        .text()
        .trim();
      const chapterNumber = chapter;
      const content = [];
      $(".col-md-12.mt-2.mb-2 > .w-100 p").each((index, element) => {
        const p = $(element).text().trim();
        content.push(p);
      });
      const filteredContent = content.filter(
        (p) =>
          p !== "" &&
          p !== "Sponsored Content" &&
          p !==
            "If you find any errors ( Ads popup, ads redirect, broken links, non-standard content, etc.. ), Please let us know < report chapter > so we can fix it as soon as possible." &&
          p !==
            "Tip: You can use left, right, A and D keyboard keys to browse between chapters."
      );
      const prevChapterBtn = $(
        ".chapter-player-options-right .cm-dropdown"
      ).prev();
      const prevChapterUrl =
        prevChapterBtn.length && prevChapterBtn.attr("href") !== "javascript:;"
          ? prevChapterBtn.attr("href")
          : null;
      const prevChapterSlug = prevChapterUrl
        ? prevChapterUrl.replace(`${baseURL}/`, "").replace("chapter-", "")
        : null;

      const nextChapterBtn = $(
        ".chapter-player-options-right .cm-dropdown"
      ).next();
      const nextChapterUrl =
        nextChapterBtn.length && nextChapterBtn.attr("href") !== "javascript:;"
          ? nextChapterBtn.attr("href")
          : null;
      const nextChapterSlug = nextChapterUrl
        ? nextChapterUrl.replace(`${baseURL}/`, "").replace("chapter-", "")
        : null;
      const data = {
        seriesTitle,
        chapterNumber,
        content: filteredContent,
        prevChapterSlug,
        nextChapterSlug,
      };
      // myCache.set(`${slug}-${chapter}`, data, 60 * 60 * 24);
      return {
        message: "success",
        data,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: {},
      };
    }
  }
}

async function getAllGenres() {
  if (myCache.has("all-genres")) {
    return {
      message: "success",
      genres: myCache.get("all-genres"),
    };
  } else {
    try {
      const res = await axios.get(`${baseURL}`);
      const $ = cheerio.load(res.data);
      // Find the genres list
      const genresList = $('.nav-bar-menu li > a[href^="/category/"]');
      // Extract genres and slugs
      const genres = [];
      genresList.each((index, element) => {
        const genreName = $(element).text().trim();
        const genreSlug = $(element)
          .attr("href")
          .replace(/^\/category\//, ""); // Remove '/genre/' from the beginning
        genres.push({ genreName, genreSlug });
      });
      if (genres.length === 0) {
        throw new Error("Failed to retrieve necessary information");
      }
      myCache.set("all-genres", genres, 60 * 60 * 24);
      return {
        message: "success",
        genres,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        genres: [],
      };
    }
  }
}

async function getNovelUpdates(page) {
  if (myCache.has(`novel-updates-${page}`)) {
    return {
      message: "success",
      page,
      data: myCache.get(`novel-updates-${page}`),
    };
  } else {
    let url = `${baseURL}/latest-updates/${page}`;
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);
      // Initialize an object to store novel information with slugs as keys
      const novelDict = {};
      // Iterate over each <li> element in the <ul>
      $(".latest-updates ul li").each((index, element) => {
        // Extract information for each novel
        const title = $(element).find(".latest-updates-name a").text().trim();
        const cover = $(element).find(".latest-updates-img img").attr("src");
        const latestChapter = $(element)
          .find(".latest-updates-content a:first-child")
          .text()
          .replace("Ch. ", "")
          .trim();
        const slug = $(element)
          .find(".latest-updates-name a")
          .attr("href")
          .replace("/", "");
        const dateUpdated = $(element)
          .find(".latest-updates-content a:last-child")
          .text()
          .trim();
        // Check if the slug is already in the dictionary
        if (!novelDict[slug]) {
          // If not, add the novel information to the dictionary
          novelDict[slug] = { title, cover, slug, latestChapter, dateUpdated };
        }
      });
      // Convert the novel dictionary values to an array
      const novelList = Object.values(novelDict);
      if (novelList.length === 0) {
        throw new Error("Failed to retrieve necessary information");
      }
      myCache.set(`novel-updates-${page}`, novelList, 60);
      return {
        message: "success",
        page,
        data: novelList,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: [],
      };
    }
  }
}

async function getSearchNovel(search) {
  if (myCache.has(`novel-search-${search}`)) {
    return {
      message: "success",
      data: myCache.get(`novel-search-${search}`),
    };
  } else {
    if (search.length < 3) {
      throw new Error("Search query must be at least 3 characters long");
    }
    let url = `${baseURL}/search/autocomplete?dataType=json&query=${search}`;
    try {
      const res = await axios.get(url);
      const items = [];
      const data = res.data.results || [];
      for (let i = 0; i < data.length; i++) {
        const title = data[i].original_title;
        const slug = data[i].link.replace(`${baseURL}/`, "");
        const cover = data[i].image;
        items.push({ title, slug, cover });
      }
      if (items.length === 0) {
        throw new Error("Search query not found");
      }
      myCache.set(`novel-search-${search}`, items, 60 * 60 * 24);
      return {
        message: "success",
        data: items,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: [],
      };
    }
  }
}

async function getNovelHome() {
  if (myCache.has("novel-home")) {
    return {
      message: "success",
      data: myCache.get("novel-home"),
    };
  } else {
    try {
      const res = await axios.get(`${baseURL}`);
      const $ = cheerio.load(res.data);
      function extractNovelInfo(sectionSelector) {
        const novelList = [];
        // Select the section
        const section = $(sectionSelector);
        // Iterate over each <div> with class "card-v" inside the section
        section.find(".card-v").each((index, element) => {
          const novelInfo = {};
          // Extract information for each novel
          novelInfo.title = $(element).find(".card-v-name a").text().trim();
          novelInfo.chapter = $(element)
            .find(".card-v-chapters a")
            .text()
            .replace("Chapter ", "")
            .trim();
          novelInfo.cover = $(element).find(".card-v-image img").attr("src");
          novelInfo.status = $(element)
            .find(".card-v-status a")
            .text()
            .replace("0", "N/A")
            .trim();
          novelInfo.slug = $(element)
            .find(".card-v-name a")
            .attr("href")
            .replace(`${baseURL}/`, "");
          novelInfo.score = $(element)
            .find(".card-v-image-score")
            .text()
            .trim();
          novelList.push(novelInfo);
        });
        return novelList;
      }
      // Extract novel information from "NEW NOVEL" section
      const newNovelList = extractNovelInfo(
        'section:has(h2:contains("NEW NOVEL"))'
      );
      // Extract novel information from "POPULAR UPDATES" section
      const popularNovelList = extractNovelInfo(
        'section:has(h2:contains("POPULAR UPDATES"))'
      );
      const data = {
        newNovelList,
        popularNovelList,
      };
      myCache.set("novel-home", data, 60);
      return {
        message: "success",
        data,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: null,
      };
    }
  }
}

async function getNovelList(page, sortBy, type, genreSlug) {
  if (myCache.has(`novel-list-${page}-${sortBy}`)) {
    return {
      message: "success",
      page,
      data:
        type === "ranking"
          ? myCache.get(`novel-list-${type}-${page}-${sortBy}`)
          : myCache.get(`novel-list-${genreSlug}-${page}-${sortBy}`),
    };
  } else {
    let url;
    if (type === "ranking") {
      url = `${baseURL}/ranking/${sortBy}/${page}`;
    } else {
      url = `${baseURL}/category/${genreSlug}/${page}?change_type=${sortBy}`;
    }
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);
      const novelList = [];

      $(".category-items.cm-list > ul > li").each(function () {
        const title = $(this).find(".category-name a").text().trim();
        const slug = $(this)
          .find(".category-name a")
          .attr("href")
          .replace("/", "");
        const cover = $(this).find(".category-img img").attr("src");
        const status = $(this)
          .find(".card-v-status a")
          .text()
          .replace("0", "N/A")
          .trim();
        const rating = $(this)
          .find(".category-bottom-buttons .js-star-rating-read-only")
          .data("score");
        const type = $(this)
          .find(".category-feature-content ul li:nth-child(3) span")
          .text()
          .trim();

        const novelInfo = {
          title,
          slug,
          cover,
          status,
          rating,
          type,
        };

        novelList.push(novelInfo);
      });
      if (novelList.length === 0) {
        throw new Error("Failed to retrieve necessary information");
      }
      myCache.set(
        type === "ranking"
          ? `novel-list-${type}-${page}-${sortBy}`
          : `novel-list-${genreSlug}-${page}-${sortBy}`,
        novelList,
        60 * 60 * 24
      );
      return {
        message: "success",
        page,
        data: novelList,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: [],
      };
    }
  }
}

async function getNovelDirectory(alphabet) {
  if (myCache.has(`novel-directory-${alphabet}`)) {
    return {
      message: "success",
      data: myCache.get(`novel-directory-${alphabet}`),
    };
  } else {
    try {
      if (alphabet.length !== 1) {
        throw new Error("Alphabet must be a single character");
      }
      const res = await axios.get(`${baseURL}/directory/${alphabet}`);
      const $ = cheerio.load(res.data);
      const novelList = [];
      $(".list-items ul li").each(function () {
        const title = $(this).find(".list-items-details-name a").text().trim();
        const slug = $(this)
          .find(".list-items-details-name a")
          .attr("href")
          .replace(`${baseURL}/`, "");
        const cover = $(this).find(".list-items-details-img img").attr("src");
        const rating = $(this)
          .find(
            '.list-items-details-points-item strong:contains("Rating") + span'
          )
          .text()
          .trim();
        const novelInfo = {
          title,
          slug,
          cover,
          rating,
        };
        novelList.push(novelInfo);
      });
      myCache.set(`novel-directory-${alphabet}`, novelList, 60 * 60 * 24);
      return {
        message: "success",
        data: novelList,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: [],
      };
    }
  }
}

export {
  getNovel,
  getChapter,
  getAllGenres,
  getNovelUpdates,
  getSearchNovel,
  getNovelHome,
  getNovelList,
  getNovelDirectory,
};
