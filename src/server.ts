import app from "./app.js";
import { runtimeConfig } from "./utils/env.js";

const PORT = runtimeConfig.port;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
