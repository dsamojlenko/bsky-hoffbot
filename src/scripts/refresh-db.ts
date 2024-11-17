import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askConfirmation = (question: string): Promise<boolean> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
};

const main = async () => {
  const confirmed = await askConfirmation(
    'Are you sure you want to refresh the database? (yes/no): ',
  );
  rl.close();

  if (!confirmed) {
    console.log('Database refresh aborted.');
    return;
  }

  const { refreshDatabase } = await import('../database/refresh');

  refreshDatabase()
    .then(() => {
      console.log('Database refreshed successfully');
    })
    .catch((err) => {
      console.error('Error refreshing database', err);
    });
};

main();
