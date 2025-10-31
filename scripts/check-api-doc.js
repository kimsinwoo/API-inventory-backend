const fs = require('fs');

const data = JSON.parse(fs.readFileSync('COMPLETE_API_DOCUMENTATION.json', 'utf-8'));

console.log('='.repeat(60));
console.log('API DOCUMENTATION STATISTICS');
console.log('='.repeat(60));
console.log(`Total Endpoints: ${data.endpoints.length}`);
console.log(`With Body Schema: ${data.endpoints.filter(e => e.body).length}`);
console.log(`With Query Params: ${data.endpoints.filter(e => e.query).length}`);

const groups = {};
data.endpoints.forEach(e => {
  groups[e.group] = (groups[e.group] || 0) + 1;
});

console.log('\nEndpoints by Group:');
console.log('-'.repeat(60));
Object.entries(groups)
  .sort((a, b) => b[1] - a[1])
  .forEach(([group, count]) => {
    console.log(`  ${group.padEnd(25)} ${count} endpoints`);
  });

console.log('\n' + '='.repeat(60));


