# Composio Actions Guide for Email Harvester Pro

## How to Find Available Actions in Lyzr Dashboard

Since I cannot access the Composio documentation directly, here's how to find the correct action names:

### In the Lyzr Dashboard:

1. Navigate to your agent: `696a74c59ea90559bbf3f052`
2. Click on "Add Tool" or "Configure Tools"
3. Select "Gmail" from Composio integrations
4. You should see a list or dropdown of available actions
5. Note down EXACTLY what actions are listed

### Common Composio Action Patterns:

Composio typically uses these naming formats:
- `APPNAME_ACTION_NAME` (all uppercase with underscores)
- Example: `GMAIL_SEND_EMAIL`, `NOTION_CREATE_PAGE`

### Actions Likely Needed for Email Harvester Pro:

#### For Gmail (email scanning):
Look for actions related to:
- **Search/Query emails**: Something like `GMAIL_SEARCH`, `GMAIL_QUERY`, `GMAIL_LIST_MESSAGES`, or `GMAIL_FIND_EMAILS`
- **Read email content**: Something like `GMAIL_GET_MESSAGE`, `GMAIL_READ_EMAIL`, or `GMAIL_FETCH_MESSAGE`
- **List emails**: Something like `GMAIL_LIST`, `GMAIL_GET_EMAILS`, or `GMAIL_FETCH_EMAILS`

#### For Notion (database/page creation):
Look for actions related to:
- **Create database**: Something like `NOTION_CREATE_DATABASE` or `NOTION_NEW_DATABASE`
- **Create pages**: Something like `NOTION_CREATE_PAGE`, `NOTION_NEW_PAGE`, or `NOTION_ADD_PAGE`
- **Query/search database**: Something like `NOTION_QUERY_DATABASE`, `NOTION_SEARCH`, or `NOTION_FETCH_DATABASE`
- **Update pages**: Something like `NOTION_UPDATE_PAGE` or `NOTION_EDIT_PAGE`
- **Add page content**: Something like `NOTION_ADD_CONTENT`, `NOTION_UPDATE_CONTENT`, or `NOTION_APPEND_CONTENT`

### What to Do Next:

1. **In Lyzr Dashboard**, open the tool configuration for Gmail
2. **Copy the EXACT action names** you see in the interface (including capitalization and underscores)
3. **Tell me the action names** you see available - I'll help you select the right ones
4. **Repeat for Notion**

### Alternative: Use Wildcard or "All Actions"

Some platforms allow:
- Selecting "All Gmail actions"
- Using a wildcard like `GMAIL_*`
- Enabling all actions at once

If you see an option like this, you can enable it temporarily to test if the agent works, then narrow down to specific actions later.

### Expected Behavior After Reconnecting:

Once tools are properly connected with the correct actions:
- Agent should scan your REAL Gmail inbox
- Agent should find emails from domains you specify
- Agent should create REAL Notion databases (not mock data)
- No more fake contacts like "john@snowflake.com"

---

## Current Agent Status:

- **Agent ID**: `696a74c59ea90559bbf3f052`
- **Tool Configs**: Currently empty `[]` (tools disconnected)
- **Status**: Waiting for you to reconnect Gmail and Notion tools with correct actions

## Next Steps:

1. Look at what actions are ACTUALLY available in the Lyzr dashboard
2. Let me know the exact action names you see
3. I'll help you select the minimum required actions for the Email Harvester to work
