const fs = require('fs');

let content = fs.readFileSync('components/ThemeSelector.tsx', 'utf-8');

const userBubbleStart = content.indexOf("{activeTab === 'userBubble' && (");
const userBubbleEnd = content.indexOf("{activeTab === 'aiBubble' && (");

const userBubbleBlock = content.substring(userBubbleStart, userBubbleEnd);

// Find exactly the aiBubble block to replace
const regex = /\{activeTab === 'aiBubble' && \([\s\S]*?<\/>\n[\s]*\)\}/;

const newAiBubbleBlock = userBubbleBlock
  .replace(/activeTab === 'userBubble'/g, "activeTab === 'aiBubble'")
  .replace(/onStyleChange\(\{ userBubble:/g, "onStyleChange({ aiBubble:")
  .replace(/appStyles\.userBubble/g, "appStyles.aiBubble")
  .replace(/renderBubblePreview\('([^']+)', true\)/g, "renderBubblePreview('$1', false)");

content = content.replace(regex, newAiBubbleBlock.trim());

fs.writeFileSync('components/ThemeSelector.tsx', content);
