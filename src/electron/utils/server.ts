import { detect } from "detect-port";

/**
 * Finds an available port starting from a given port.
 * @param startingFrom - The port number to start searching from.
 * @returns A Promise that resolves to the first available port number.
 */
export async function findAvailablePort(startingFrom: number): Promise<number> {
	return detect(startingFrom)
		.then((realPort) => {
			return realPort; // Return the available port
		})
		.catch((err) => {
			console.error(`Error detecting port: ${err.message}`);
			throw err; // Rethrow the error for further handling if needed
		});
}
