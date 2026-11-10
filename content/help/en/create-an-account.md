---
id: create-an-account
title: Create a Flexi Day account
summary: Sign up with your email or with Google, Microsoft or Apple, and confirm your address.
module: account
roles: [member, owner]
keywords: [sign up, register, new account, verification email, confirm email, activate, get started]
related: [sign-in, join-a-group, create-a-group]
goldenQuestions:
  - question: I signed up but can't log in, what do I do?
    expectedArticles: [create-an-account]
    mustMention: [confirm your email address, link is valid for one hour]
  - question: Do I need a credit card to start using Flexi Day?
    expectedArticles: [create-an-account]
    mustMention: [Free plan, no credit card]
---

You create an account on the sign-up page with your name, your work email and a password, or with
Google, Microsoft or Apple. Then you confirm your email address from the email Flexi Day sends you.

If someone invited you to a group, use the link in your invite email instead. It creates your
account and puts you in the group in one step. See [Join a group](help:join-a-group).

## Sign up with email and password

1. Open the sign-up page and fill in your name, your work email and a password of at least 8
   characters. Type the password twice.
2. Press "{{ui:auth.signUp.submit}}".
3. Open the verification email and follow its link. The link is valid for one hour.

Once you confirm, you are signed in and land on the {{ui:nav.dashboard}}. You can't sign in with
your password until the address is confirmed. A password that has appeared in a known data breach is
refused, so pick another one.

## Sign up with Google, Microsoft or Apple

Press "{{ui:auth.continueWithGoogle}}", "{{ui:auth.continueWithMicrosoft}}" or
"{{ui:auth.continueWithApple}}" on the sign-up page. Flexi Day creates the account with the address
the provider shares and still sends its own email to confirm it. If that address already has a
Flexi Day account, sign in the way you did before and connect the provider from
{{ui:nav.settings}}. See [Sign in to Flexi Day](help:sign-in).

## The confirmation link expired

Use "{{ui:auth.signIn.forgot}}" on the sign-in page and set a password from the email it sends.
Following that reset link confirms your address too, and you can then sign in. The reset link is
also valid for one hour.

## What happens next

A new account starts in no group, so there is nowhere to book time off yet. The
{{ui:nav.dashboard}} offers two ways forward:

- Join your team's group with the invite link or code you got. See
  [Join a group](help:join-a-group).
- Create a group of your own. You become its manager, and Flexi Day sets up an organization for you
  on the Free plan. No credit card is needed. See [Create a group](help:create-a-group).
