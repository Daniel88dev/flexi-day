import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpArticle, helpArticleMetadata } from "@/components/help/help-article";
import { getHelpArticle, helpArticleIds } from "@/lib/help/knowledge-base";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return helpArticleIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getHelpArticle("en", (await params).id);
  return article ? helpArticleMetadata("en", article) : {};
}

export default async function HelpArticlePage({ params }: Props) {
  const article = getHelpArticle("en", (await params).id);
  if (!article) notFound();
  return <HelpArticle locale="en" article={article} />;
}
