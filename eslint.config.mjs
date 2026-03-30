import next from "eslint-config-next"

const config = [
  ...next,
  {
    rules: {
      // Marketing/editorial copy uses natural apostrophes and quotes in JSX text.
      "react/no-unescaped-entities": "off",
    },
  },
  // Invite claim: sync token from URL into state, then strip ?token= (see page comment in code).
  {
    files: ["app/invite/claim/page.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default config
