import {
  RedpandaContainer,
  type StartedRedpandaContainer,
} from '@testcontainers/redpanda'

const REDPANDA_IMAGE = 'docker.redpanda.com/redpandadata/redpanda:v23.3.10'

export async function kafkaSetup(): Promise<{
  container: StartedRedpandaContainer
  brokers: Array<string>
}> {
  const container = await new RedpandaContainer(REDPANDA_IMAGE).start()

  const brokers = [container.getBootstrapServers()]

  return { container, brokers }
}
