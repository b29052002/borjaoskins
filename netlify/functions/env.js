exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript',
    },
    body: `window.ENV = {
  SUPABASE_URL: '${process.env.SUPABASE_URL}',
  SUPABASE_KEY: '${process.env.SUPABASE_KEY}',
  ADMIN_HASH: '${process.env.ADMIN_HASH}'
};`
  };
};
