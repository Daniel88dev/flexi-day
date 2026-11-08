---
id: sign-in
title: Sign in, reset your password and use two-factor authentication
summary: Sign in with a password or with Google, Microsoft or Apple, reset a forgotten password, and add a second step.
module: account
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/settings]
keywords:
  [
    log in,
    login,
    forgot password,
    reset password,
    2fa,
    two-factor,
    authenticator,
    backup codes,
    google,
    microsoft,
    apple,
    sign-in methods,
  ]
related: [create-an-account, account-settings]
goldenQuestions:
  - question: I forgot my password, how do I get back in?
    expectedArticles: [sign-in]
    mustMention: [Forgot?, the reset link is valid for one hour]
  - question: How do I turn on two-factor authentication?
    expectedArticles: [sign-in]
    mustMention: [Settings, authenticator app or email code, backup codes]
  - question: Can I log in with Google instead of my password?
    expectedArticles: [sign-in]
    mustMention: [Sign-in methods in Settings, same email address]
---

Sign in on the sign-in page with your email and password, or with Google, Microsoft or Apple if you
connected one of them to your account.

## Forgot your password

1. On the sign-in page, choose "{{ui:auth.signIn.forgot}}".
2. Enter your email and press "{{ui:auth.forgot.submit}}".
3. Follow the link in the email and set a new password of at least 8 characters. The link is valid
   for one hour.

Setting a new password signs you out everywhere else, including your phone. If you never confirmed
your email address, the reset confirms it.

## Change your password

When you know your current password, change it in the "{{ui:settings.changePassword}}" card in
{{ui:nav.settings}}. An account that only ever signed in with Google, Microsoft or Apple has no
password. To add one, sign out and use "{{ui:auth.signIn.forgot}}"; the link sets it.

## Sign in with Google, Microsoft or Apple

Connect a provider in the "{{ui:settings.connectedAccounts.title}}" card in {{ui:nav.settings}}. The
provider account has to use the same email address as your Flexi Day account. After that the
matching button on the sign-in page signs you in. You can disconnect a method there too, as long as
another way to sign in remains.

Signing in with a provider whose address already has a Flexi Day account, without connecting it
first, is refused. Sign in the way you did before, then connect the provider from
{{ui:nav.settings}}.

## Two-factor authentication

Two-factor authentication adds a second step to password sign-in. Sign-in with Google, Microsoft or
Apple doesn't ask for it.

To turn it on, open {{ui:nav.settings}}, find "{{ui:settings.twoFactor.title}}" and press
"{{ui:settings.twoFactor.enable}}". Confirm your password, then pick your second step:

- **{{ui:settings.twoFactor.methodTotp}}**: scan the QR code with an app such as Google
  Authenticator or 1Password and enter the 6-digit code it shows.
- **{{ui:settings.twoFactor.methodOtp}}**: Flexi Day emails you a 6-digit code at each sign-in. It
  expires after three minutes.

Then save your backup codes. Each one signs you in once when you can't reach your authenticator or
your email, and they are shown only once. "{{ui:settings.twoFactor.regenerateBackup}}" makes a fresh
set.

When you sign in, tick "{{ui:auth.twoFactor.trustDevice}}" to skip the second step on that browser
for 30 days. Too many wrong codes lock the account for a few minutes.
