# LilUsage Privacy Policy

_Last updated: <DATE>_

## Summary

LilUsage collects nothing. There is no server operated by this app, no analytics,
no tracking, and no advertising.

## What the app reads

With your explicit permission, granted by selecting the file yourself in a system
open panel, LilUsage reads Claude Code's credentials file:

    ~/.claude/.credentials.json

The file is read, never modified. Permission is stored as a macOS security-scoped
bookmark on your Mac and can be revoked at any time from the app's menu, or by
deleting the app.

## What is transmitted, and to whom

The access token from that file is sent over HTTPS to Anthropic, at:

    https://api.anthropic.com/api/oauth/usage

solely to retrieve your own usage percentages. This is the same service your
Claude Code installation already communicates with. Anthropic's handling of that
request is governed by Anthropic's own privacy policy.

No data is sent anywhere else. The developer of LilUsage receives nothing.

## What is stored on your Mac

- The security-scoped bookmark granting read access to the file you selected
- Two settings: whether to show the percentage, and whether to launch at login
- Whether the introduction screen has been shown

All of it lives in this app's own preferences and is removed when you delete the
app. Nothing is stored off your device.

## Children

LilUsage is not directed at children and collects no personal information from
anyone.

## Changes

Any change to this policy will be published at this URL with an updated date.

## Contact

<your-email>
