import hudson.model.Node
import hudson.slaves.DumbSlave
import hudson.slaves.JNLPLauncher
import hudson.slaves.RetentionStrategy
import jenkins.model.Jenkins
import java.util.LinkedList

String agentName = System.getenv('JENKINS_AGENT_NAME') ?: 'idle-game-build-agent'
String agentLabel = System.getenv('JENKINS_AGENT_LABEL') ?: 'idle-game-build-agent linux docker'
String remoteFs = System.getenv('JENKINS_AGENT_REMOTE_FS') ?: '/home/jenkins/agent'
String executors = System.getenv('JENKINS_AGENT_EXECUTORS') ?: '1'

Jenkins jenkins = Jenkins.get()

if (jenkins.getNumExecutors() != 0) {
    jenkins.setNumExecutors(0)
    println('Set Jenkins controller executors to 0 so builds run on agents only')
}

def node = jenkins.getNode(agentName)
if (node == null) {
    node = new DumbSlave(
        agentName,
        'Managed local Docker build agent',
        remoteFs,
        executors,
        Node.Mode.NORMAL,
        agentLabel,
        new JNLPLauncher(),
        RetentionStrategy.INSTANCE,
        new LinkedList()
    )
    jenkins.addNode(node)
    println("Created Jenkins inbound agent node: ${agentName}")
} else {
    node.setNumExecutors(Integer.parseInt(executors))
    node.setLabelString(agentLabel)
    node.setMode(Node.Mode.NORMAL)
    node.setLauncher(new JNLPLauncher())
    println("Ensured Jenkins inbound agent node exists: ${agentName}")
}

jenkins.save()
