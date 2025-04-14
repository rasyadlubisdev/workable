import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "langchain/output_parsers"
import { z } from "zod"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

const simpleResponseSchema = z.object({
  response: z.string(),
})

export const openaiService = {
  async createChatCompletion(messages: ChatMessage[]): Promise<string> {
    try {
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        console.log("No OpenAI API key found, using mock responses")
        return await simulateAIResponse(messages)
      }

      const parser = StructuredOutputParser.fromZodSchema(simpleResponseSchema)
      const formatInstructions = parser.getFormatInstructions()

      const lastUserMessage =
        messages.filter((m) => m.role === "user").pop()?.content || ""
      const systemMessage =
        messages.find((m) => m.role === "system")?.content || ""

      const promptTemplate = new PromptTemplate({
        template: `
        ${systemMessage}

        User Message: {userMessage}

        Berikan respons yang membantu, informatif, dan positif. Pastikan format jawaban dalam Bahasa Indonesia.

        {format_instructions}
        `,
        inputVariables: ["userMessage"],
        partialVariables: { format_instructions: formatInstructions },
      })

      const promptValue = await promptTemplate.format({
        userMessage: lastUserMessage,
      })

      const response = await model.invoke(promptValue)
      const responseText = response.content.toString()

      try {
        const parsed = await parser.parse(responseText)
        return parsed.response
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)

        if (responseText) {
          return responseText
        } else {
          return "Maaf, saya mengalami masalah dalam memproses respons. Mohon coba lagi."
        }
      }
    } catch (error) {
      console.error("Error calling OpenAI:", error)
      return "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti."
    }
  },
}

async function simulateAIResponse(messages: ChatMessage[]): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const lastUserMessage =
    messages
      .filter((m) => m.role === "user")
      .pop()
      ?.content.toLowerCase() || ""
  const systemMessage = messages.find((m) => m.role === "system")?.content || ""

  if (systemMessage.includes("saran karir")) {
    return `Berdasarkan informasi yang Anda berikan, berikut adalah saran karir yang sesuai untuk penyandang disabilitas:

1. **Pengembangan Web/Software** - Bidang teknologi menawarkan fleksibilitas bekerja jarak jauh dan aksesibilitas yang baik dengan bantuan teknologi. Banyak penyandang disabilitas sukses di bidang ini.

2. **Content Creator/Writer** - Pekerjaan yang bisa dilakukan dari rumah dengan jadwal fleksibel. Cocok untuk mereka yang memiliki keterampilan komunikasi yang baik.

3. **Desain Grafis** - Bidang kreatif yang dapat dilakukan secara freelance dan tidak selalu memerlukan mobilitas fisik.

4. **Analisis Data** - Pekerjaan yang bertumbuh pesat dan dapat dilakukan remote, hanya membutuhkan komputer dan koneksi internet.

5. **Virtual Assistant** - Peran administratif yang dapat disesuaikan dengan kebutuhan aksesibilitas Anda.

Saran pengembangan:

- Investasikan waktu untuk pelatihan online di bidang yang Anda minati. Banyak platform seperti Coursera dan Udemy menawarkan kursus yang aksesibel.
- Bangun portofolio proyek untuk menunjukkan kemampuan Anda.
- Bergabunglah dengan komunitas profesional untuk penyandang disabilitas untuk networking.

Apakah ada bidang spesifik dari daftar di atas yang menarik minat Anda? Saya bisa memberikan informasi lebih lanjut tentang jalur karir tersebut.`
  } else if (systemMessage.includes("CV")) {
    return `Setelah meninjau CV Anda, berikut beberapa saran untuk meningkatkannya:

1. **Tambahkan ringkasan profesional yang kuat** di bagian atas CV. Ringkasan ini sebaiknya terdiri dari 3-4 kalimat yang menyoroti kualifikasi, pengalaman, dan tujuan karir Anda.

2. **Soroti prestasi dengan angka dan hasil konkret**. Alih-alih hanya mencantumkan tugas, tunjukkan dampak pekerjaan Anda. Misalnya: "Meningkatkan efisiensi proses sebesar 25%" atau "Mengelola tim yang terdiri dari 5 anggota".

3. **Sesuaikan CV untuk setiap lamaran**. Tekankan keterampilan dan pengalaman yang paling relevan dengan posisi yang Anda lamar.

4. **Tambahkan bagian keterampilan teknis** yang terorganisir dengan baik. Kelompokkan keterampilan berdasarkan kategori (misalnya, perangkat lunak, bahasa pemrograman, bahasa asing).

5. **Gunakan kata kerja kuat** di awal setiap poin pengalaman, seperti "mengelola", "mengembangkan", "memimpin", "merancang".

6. **Fokus pada kekuatan, bukan batasan**. Jika relevan, Anda dapat menyebutkan akomodasi yang memungkinkan Anda bekerja secara optimal, tapi selalu dengan nada positif.

7. **Sertakan link ke portofolio online** atau profil LinkedIn jika ada.

8. **Pastikan format konsisten** dalam penggunaan font, spasi, dan tata letak untuk memudahkan pembacaan.

Apakah Anda ingin saya membantu dengan bagian spesifik dari CV Anda?`
  } else if (systemMessage.includes("rekomendasi lowongan")) {
    return `Berdasarkan keahlian dan minat Anda, berikut adalah beberapa lowongan pekerjaan yang mungkin sesuai:

1. [Software Engineer di PT Tech Indonesia](/job-seeker/job/j001) - Posisi full-time untuk pengembang dengan keahlian JavaScript dan React. Perusahaan menawarkan lingkungan kerja yang fleksibel dan mendukung karyawan dengan disabilitas.

2. [Content Writer di Media Digital](/job-seeker/job/j002) - Pekerjaan remote untuk penulis konten dengan pengetahuan dasar SEO. Ideal untuk mereka yang memiliki keterampilan komunikasi tertulis yang baik.

3. [Customer Support Specialist](/job-seeker/job/j003) - Peran part-time yang dapat dilakukan dari rumah, mencari kandidat dengan kemampuan komunikasi yang baik.

4. [UI/UX Designer](/job-seeker/job/j004) - Posisi yang mencari desainer dengan pengalaman dalam desain antarmuka. Perusahaan ini sangat peduli tentang aksesibilitas digital.

5. [Marketing Assistant](/job-seeker/job/j005) - Posisi entry-level yang mencari seseorang dengan keterampilan komunikasi dan kreativitas.

Semua lowongan ini telah dikonfirmasi ramah bagi penyandang disabilitas. Apakah ada posisi tertentu yang menarik perhatian Anda? Saya dapat memberikan informasi lebih lanjut atau mencari lowongan dengan kriteria yang lebih spesifik.`
  } else {
    return `Terima kasih atas pertanyaan Anda. Sebagai asisten WorkAble, saya di sini untuk membantu Anda dalam perjalanan karir Anda.

WorkAble adalah platform yang dirancang khusus untuk menghubungkan penyandang disabilitas dengan peluang karir yang inklusif. Kami menyediakan berbagai fitur untuk membantu Anda mendapatkan pekerjaan yang sesuai dengan keahlian dan kebutuhan Anda.

Beberapa cara saya dapat membantu Anda:

1. **Konsultasi Karir** - Saya dapat membantu mengidentifikasi jalur karir yang sesuai dengan keterampilan, minat, dan kebutuhan aksesibilitas Anda.

2. **Perbaikan CV** - Saya dapat memberikan saran untuk membuat CV Anda menonjol dan menyoroti kekuatan Anda.

3. **Rekomendasi Pekerjaan** - Saya dapat mencarikan lowongan pekerjaan yang sesuai dengan profil Anda.

4. **Tips Wawancara** - Saya dapat membantu Anda mempersiapkan diri untuk wawancara kerja.

5. **Informasi tentang Hak dan Akomodasi** - Saya dapat memberikan informasi tentang hak penyandang disabilitas di tempat kerja dan akomodasi yang dapat diminta.

Semua layanan ini tersedia untuk membantu Anda menemukan dan mendapatkan pekerjaan yang bermanfaat dan bermakna. Apa yang paling Anda butuhkan saat ini?`
  }
}
