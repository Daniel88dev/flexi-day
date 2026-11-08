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
  const article = getHelpArticle("cs", (await params).id);
  return article ? helpArticleMetadata("cs", article) : {};
}

export default async function CsHelpArticlePage({ params }: Props) {
  const article = getHelpArticle("cs", (await params).id);
  if (!article) notFound();
  return <HelpArticle locale="cs" article={article} />;
}
