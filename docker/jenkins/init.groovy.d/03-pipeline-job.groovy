import jenkins.model.Jenkins
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition
import org.jenkinsci.plugins.workflow.job.WorkflowJob

String jobName = 'idle-game-ci'
String pipelinePath = '/workspace/idle-game/Jenkinsfile'

File pipelineFile = new File(pipelinePath)
if (!pipelineFile.exists()) {
    println("Pipeline file not found, skipping job sync: ${pipelinePath}")
    return
}

String pipelineScript = pipelineFile.getText('UTF-8')
Jenkins jenkins = Jenkins.get()
WorkflowJob job = jenkins.getItemByFullName(jobName, WorkflowJob.class)

if (job == null) {
    job = jenkins.createProject(WorkflowJob.class, jobName)
    println("Created pipeline job: ${jobName}")
}

def currentDefinition = job.getDefinition()
boolean needsUpdate = !(currentDefinition instanceof CpsFlowDefinition)

if (!needsUpdate) {
    needsUpdate = currentDefinition.getScript() != pipelineScript
}

if (needsUpdate) {
    job.setDefinition(new CpsFlowDefinition(pipelineScript, true))
    job.save()
    println("Synchronized pipeline job from ${pipelinePath}")
} else {
    println("Pipeline job already matches ${pipelinePath}")
}

jenkins.save()
