import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchArticleBySlug } from "../api";

export default function ArticleRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticleBySlug(slug).then((article) => {
      if (article?.id) {
        navigate(`/app?article=${article.id}`, { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    });
  }, [slug, navigate]);

  return null;
}
